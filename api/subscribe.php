<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

const TEMP_EMAIL_DOMAINS = [
    'mailinator.com',
    'tempmail.com',
    '10minutemail.com',
    'guerrillamail.com',
    'yopmail.com',
];

/**
 * Send a JSON response and stop execution.
 */
function respond(array $data, int $statusCode = 200): void
{
    http_response_code($statusCode);
    echo json_encode($data);
    exit;
}

/**
 * Load request payload from JSON or form data.
 */
function load_payload(): array
{
    $rawBody = file_get_contents('php://input');
    $payload = json_decode((string) $rawBody, true);

    if (json_last_error() === JSON_ERROR_NONE && is_array($payload)) {
        return $payload;
    }

    // Fallback to form-encoded payloads if JSON is not present.
    return $_POST ?: [];
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    respond(['success' => false, 'message' => 'Method not allowed.'], 405);
}

$payload = load_payload();
$email = trim((string) ($payload['email'] ?? ''));
$honeypot = trim((string) ($payload['website'] ?? ''));

if ($honeypot !== '') {
    respond(['success' => false, 'message' => 'Bot detected.'], 400);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(['success' => false, 'message' => 'Invalid email.'], 400);
}

$domain = strtolower((string) substr(strrchr($email, '@'), 1));
if ($domain && in_array($domain, TEMP_EMAIL_DOMAINS, true)) {
    respond(['success' => false, 'message' => 'Temporary emails are not allowed.'], 400);
}

$normalizedEmail = strtolower($email);
$storageDir = __DIR__ . '/../data';
$storageFile = $storageDir . '/subscribers.json';

if (!is_dir($storageDir) && !mkdir($storageDir, 0775, true) && !is_dir($storageDir)) {
    respond(['success' => false, 'message' => 'Unable to create storage.'], 500);
}

if (!file_exists($storageFile) && file_put_contents($storageFile, '[]', LOCK_EX) === false) {
    respond(['success' => false, 'message' => 'Unable to initialize storage.'], 500);
}

$rawSubscribers = file_get_contents($storageFile);
$subscribers = json_decode((string) $rawSubscribers, true);

if (!is_array($subscribers)) {
    $subscribers = [];
}

foreach ($subscribers as $entry) {
    if (($entry['email'] ?? '') === $normalizedEmail) {
        respond(['success' => true, 'message' => 'Already subscribed.'], 200);
    }
}

$subscribers[] = [
    'email' => $normalizedEmail,
    'subscribedAt' => gmdate(DATE_ATOM),
];

$encoded = json_encode($subscribers, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

if (file_put_contents($storageFile, (string) $encoded, LOCK_EX) === false) {
    respond(['success' => false, 'message' => 'Server error.'], 500);
}

respond(['success' => true, 'message' => 'Subscribed.'], 200);
