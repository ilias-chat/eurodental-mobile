# Laravel Backend Implementation for Push Notifications

## Required Files

### 1. Migration for Push Tokens
```php
// database/migrations/create_push_tokens_table.php
Schema::create('push_tokens', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->onDelete('cascade');
    $table->string('expo_push_token');
    $table->string('platform')->default('expo');
    $table->timestamps();
});
```

### 2. PushToken Model
```php
// app/Models/PushToken.php
class PushToken extends Model
{
    protected $fillable = ['user_id', 'expo_push_token', 'platform'];
    
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
```

### 3. PushToken Controller
```php
// app/Http/Controllers/PushTokenController.php
public function store(Request $request)
{
    $request->validate([
        'token' => 'required|string'
    ]);

    $user = auth()->user();
    
    $user->pushTokens()->updateOrCreate(
        ['expo_push_token' => $request->token],
        ['platform' => 'expo']
    );

    return response()->json(['message' => 'Push token saved successfully']);
}
```

### 4. Notification Service
```php
// app/Services/NotificationService.php
class NotificationService
{
    public function sendToUser($userId, $title, $body, $data = [])
    {
        $user = User::find($userId);
        $tokens = $user->pushTokens()->pluck('expo_push_token')->toArray();
        
        return $this->sendToMultipleUsers($tokens, $title, $body, $data);
    }

    public function sendToMultipleUsers($tokens, $title, $body, $data = [])
    {
        $messages = [];
        
        foreach ($tokens as $token) {
            $messages[] = [
                'to' => $token,
                'sound' => 'default',
                'title' => $title,
                'body' => $body,
                'data' => $data,
            ];
        }

        $chunks = array_chunk($messages, 100);
        
        foreach ($chunks as $chunks) {
            $this->sendChunk($chunk);
        }
    }

    private function sendChunk($messages)
    {
        $client = new \GuzzleHttp\Client();
        
        $response = $client->post('https://exp.host/--/api/v2/push/send', [
            'headers' => [
                'Accept' => 'application/json',
                'Accept-encoding' => 'gzip, deflate',
                'Content-Type' => 'application/json',
            ],
            'json' => $messages
        ]);

        return $response;
    }
}
```

### 5. API Routes
```php
// routes/api.php
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/push-token', [PushTokenController::class, 'store']);
});
```

## Usage Examples

### Send notification when task is created
```php
// In your TaskController or wherever you create tasks
$notificationService = new NotificationService();
$notificationService->sendToUser(
    $userId,
    'New Task Assigned',
    "You have a new task: {$task->title}",
    ['type' => 'task', 'taskId' => $task->id]
);
```

### Send notification when client is added
```php
// In your ClientController
$notificationService = new NotificationService();
$notificationService->sendToUser(
    $userId,
    'New Client Added',
    "New client: {$client->name}",
    ['type' => 'client', 'clientId' => $client->id]
);
```

## Important Notes

1. **Install Guzzle**: `composer require guzzlehttp/guzzle`
2. **Rate Limits**: Expo's push service has rate limits for free accounts
3. **Testing**: Test with Expo Go app first, then build standalone app
4. **Production**: For production, build standalone app using EAS Build
