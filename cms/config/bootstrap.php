<?php
// Rolodink-hook voor Cockpit: ververs de website zodra een artikel wordt opgeslagen,
// gepubliceerd, gedepubliceerd of verwijderd. Cockpit laadt config/bootstrap.php
// automatisch (zie bootstrap.php in de Cockpit-root); $app is de Lime-app.
//
// De website cachet de API-antwoorden 10 minuten (Next.js Data Cache, tag "cms").
// Deze hook maakt die cache direct ongeldig via POST /api/revalidate.

/** @var \Lime\App $app */

$rolodinkRevalidate = function (string $reason) use ($app): void {

    $url    = (string) $app->retrieve('rolodink/revalidate_url', '');
    $secret = (string) $app->retrieve('rolodink/revalidate_secret', '');

    if ($url === '' || $secret === '' || $secret === 'VUL-HIER-HET-SECRET-IN') {
        return;
    }

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode(['reason' => $reason]),
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'x-cms-secret: ' . $secret,
        ],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 3,
        CURLOPT_TIMEOUT        => 5,
    ]);

    $body   = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $error  = curl_error($ch);
    curl_close($ch);

    // Nooit het opslaan laten falen op een netwerkfout: alleen loggen.
    if ($body === false || $status >= 400) {
        error_log("rolodink revalidate ({$reason}) mislukt: HTTP {$status} {$error}");
    }
};

$rolodinkModels = (array) $app->retrieve('rolodink/models', ['over']);

$app->on('content.item.save', function (string $modelName) use ($rolodinkRevalidate, $rolodinkModels): void {
    if (in_array($modelName, $rolodinkModels, true)) {
        $rolodinkRevalidate("save:{$modelName}");
    }
});

$app->on('content.remove.before', function (string $modelName) use ($rolodinkRevalidate, $rolodinkModels): void {
    if (in_array($modelName, $rolodinkModels, true)) {
        $rolodinkRevalidate("remove:{$modelName}");
    }
});
