<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');

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

/**
 * Normalize and validate an email address.
 */
function normalize_email(string $email): string
{
    $normalized = strtolower(trim($email));

    if ($normalized === '' || !filter_var($normalized, FILTER_VALIDATE_EMAIL)) {
        respond(['success' => false, 'message' => 'Invalid email.'], 400);
    }

    $domain = substr(strrchr($normalized, '@') ?: '', 1);
    if ($domain && in_array($domain, TEMP_EMAIL_DOMAINS, true)) {
        respond(['success' => false, 'message' => 'Temporary emails are not allowed.'], 400);
    }

    return $normalized;
}

/**
 * Persist subscribers to disk with an exclusive lock.
 */
function save_subscriber(string $email, ?string $ipAddress): void
{
    $storageDir = __DIR__ . '/../data';
    $storageFile = $storageDir . '/subscribers.json';

    if (!is_dir($storageDir) && !mkdir($storageDir, 0775, true) && !is_dir($storageDir)) {
        respond(['success' => false, 'message' => 'Unable to create storage.'], 500);
    }

    $handle = fopen($storageFile, 'c+');
    if ($handle === false) {
        respond(['success' => false, 'message' => 'Unable to open storage.'], 500);
    }

    if (!flock($handle, LOCK_EX)) {
        fclose($handle);
        respond(['success' => false, 'message' => 'Unable to lock storage.'], 500);
    }

    $contents = stream_get_contents($handle);
    $subscribers = json_decode((string) $contents, true);
    if (!is_array($subscribers)) {
        $subscribers = [];
    }

    foreach ($subscribers as $entry) {
        if (($entry['email'] ?? '') === $email) {
            flock($handle, LOCK_UN);
            fclose($handle);
            respond(['success' => true, 'message' => 'Already subscribed.']);
        }
    }

    $subscribers[] = [
        'email' => $email,
        'subscribedAt' => gmdate(DATE_ATOM),
        'ip' => $ipAddress,
    ];

    $encoded = json_encode($subscribers, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

    if ($encoded === false) {
        flock($handle, LOCK_UN);
        fclose($handle);
        respond(['success' => false, 'message' => 'Server error.'], 500);
    }

    rewind($handle);
    if (ftruncate($handle, 0) === false || fwrite($handle, $encoded) === false) {
        flock($handle, LOCK_UN);
        fclose($handle);
        respond(['success' => false, 'message' => 'Unable to save subscription.'], 500);
    }

    fflush($handle);
    flock($handle, LOCK_UN);
    fclose($handle);
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    respond(['success' => false, 'message' => 'Method not allowed.'], 405);
}

$payload = load_payload();
$email = normalize_email((string) ($payload['email'] ?? ''));
$honeypot = trim((string) ($payload['website'] ?? ''));

if ($honeypot !== '') {
    respond(['success' => false, 'message' => 'Bot detected.'], 400);
}

$ip = filter_var($_SERVER['REMOTE_ADDR'] ?? '', FILTER_VALIDATE_IP) ?: null;
save_subscriber($email, $ip);

respond(['success' => true, 'message' => 'Subscribed.']);
