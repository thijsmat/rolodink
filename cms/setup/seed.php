<?php
// =====================================================================
//  Rolodink CMS: inrichting van een verse Cockpit-installatie via de CLI.
//
//  Draai dit ÉÉN keer in de Cockpit-root (de map met bootstrap.php):
//
//      php seed.php --user=matthijs --email=jij@voorbeeld.nl [--password=...]
//
//  Het script maakt aan:
//    - de admin-gebruiker (installer wordt daarmee overbodig)
//    - locale "en" (default = Nederlands)
//    - collection "over" met de velden die de website verwacht
//    - rol "website" met alleen leesrecht op "over"
//    - een API-key met die rol (voor CMS_API_KEY in Vercel)
//    - config/config.php met een vers revalidate-secret (voor CMS_REVALIDATE_SECRET)
//  en print de gegenereerde geheimen. Het is idempotent: bestaande onderdelen
//  worden overgeslagen, niet overschreven.
// =====================================================================

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    exit("Alleen via de command line.\n");
}

$root = getcwd();

if (!is_file("{$root}/bootstrap.php") || !is_dir("{$root}/modules/Content")) {
    exit("Draai dit script vanuit de Cockpit-root (map met bootstrap.php en modules/).\n");
}

$opts = getopt('', ['user::', 'name::', 'email::', 'password::', 'site-url::']);

$adminUser = (string) ($opts['user'] ?? 'admin');
$adminName = (string) ($opts['name'] ?? 'Matthijs');
$adminMail = (string) ($opts['email'] ?? '');
$adminPass = (string) ($opts['password'] ?? '');
$siteUrl   = rtrim((string) ($opts['site-url'] ?? 'https://rolodink.app'), '/');

if (!filter_var($adminMail, FILTER_VALIDATE_EMAIL)) {
    exit("Geef een geldig e-mailadres op met --email=...\n");
}

function randomToken(int $bytes = 24): string {
    return bin2hex(random_bytes($bytes));
}

if ($adminPass === '') {
    // Tijdelijk wachtwoord; na de eerste login wijzigen in de admin.
    $adminPass = substr(strtr(base64_encode(random_bytes(18)), '+/', 'Aa'), 0, 20);
}

define('APP_CLI', true);
/** @var \Lime\App $app */
$app = require_once "{$root}/bootstrap.php";
$app = Cockpit::instance();

// Cockpit's eigen CLI-handler logt fouten stil; hier willen we ze zien.
restore_exception_handler();
set_exception_handler(function (\Throwable $e): void {
    fwrite(STDERR, "FOUT: {$e->getMessage()} in {$e->getFile()}:{$e->getLine()}\n");
    exit(1);
});

$now = time();
$out = [];

// --- 1. Admin-gebruiker -------------------------------------------------
if (!$app->dataStorage->getCollection('system/users')->count()) {
    $user = [
        'active'    => true,
        'user'      => $adminUser,
        'name'      => $adminName,
        'email'     => $adminMail,
        'password'  => $app->hash($adminPass),
        'i18n'      => 'en',
        'role'      => 'admin',
        'theme'     => 'auto',
        '_modified' => $now,
        '_created'  => $now,
    ];
    $app->dataStorage->save('system/users', $user);
    $app->trigger('app.system.install');
    $out['Admin-gebruiker'] = "{$adminUser} (tijdelijk wachtwoord: {$adminPass})";
} else {
    $out['Admin-gebruiker'] = 'bestond al, overgeslagen';
}

// --- 2. Locale en ---------------------------------------------------------
if (!$app->dataStorage->findOne('system/locales', ['i18n' => 'en'])) {
    $locale = [
        'i18n'      => 'en',
        'name'      => 'English',
        'enabled'   => true,
        'meta'      => [],
        '_modified' => $now,
        '_created'  => $now,
    ];
    $app->dataStorage->save('system/locales', $locale);
    $out['Locale'] = 'en aangemaakt (default = Nederlands)';
} else {
    $out['Locale'] = 'en bestond al';
}

// --- 3. Collection "over" ------------------------------------------------
$field = function (string $name, string $type, string $label, array $extra = []): array {
    return array_replace([
        'name'     => $name,
        'type'     => $type,
        'label'    => $label,
        'info'     => '',
        'group'    => '',
        'i18n'     => false,
        'required' => false,
        'multiple' => false,
        'meta'     => [],
        'opts'     => [],
    ], $extra);
};

if (!$app->module('content')->exists('over')) {
    $app->module('content')->saveModel('over', [
        'name'      => 'over',
        'label'     => 'Over Rolodink',
        'info'      => 'Artikelen onder rolodink.app/over. Alleen gepubliceerde items zijn zichtbaar.',
        'type'      => 'collection',
        'group'     => 'Website',
        'color'     => '#1B2951',
        'revisions' => true,
        'fields'    => [
            $field('title', 'text', 'Titel', ['i18n' => true, 'required' => true]),
            $field('slug', 'text', 'Slug', [
                'required' => true,
                'info' => 'Onderdeel van de URL: kleine letters, cijfers en streepjes, uniek. Bijv. waarom-we-rolodink-bouwen',
            ]),
            $field('date', 'date', 'Publicatiedatum', ['required' => true, 'info' => 'Bepaalt de volgorde op de overzichtspagina.']),
            $field('intro', 'text', 'Intro', ['i18n' => true, 'opts' => ['multiline' => true], 'info' => 'Korte lede boven het artikel en de samenvatting in het overzicht.']),
            $field('content', 'wysiwyg', 'Tekst', ['i18n' => true]),
            $field('image', 'asset', 'Afbeelding', ['opts' => ['filter' => ['type' => 'image']], 'info' => 'Optioneel. Liggend formaat (16:9) werkt het best.']),
            $field('imageAlt', 'text', 'Alt-tekst afbeelding', ['i18n' => true]),
        ],
        'preview'   => [
            ['name' => 'Website (NL)', 'uri' => "{$siteUrl}/nl/over/{slug}"],
            ['name' => 'Website (EN)', 'uri' => "{$siteUrl}/en/over/{slug}"],
        ],
        'meta'      => null,
    ]);
    $out['Collection'] = 'over aangemaakt (7 velden)';
} else {
    $out['Collection'] = 'over bestond al';
}

// --- 4. Rol "website" ----------------------------------------------------
if (!$app->dataStorage->findOne('system/roles', ['appid' => 'website'])) {
    $role = [
        'appid'       => 'website',
        'name'        => 'Website',
        'info'        => 'Alleen lezen van gepubliceerde artikelen (rolodink.app).',
        'permissions' => ['content/over/read' => true],
        'expressions' => [],
        '_modified'   => $now,
        '_created'    => $now,
    ];
    $app->dataStorage->save('system/roles', $role);
    $out['Rol'] = 'website aangemaakt (content/over/read)';
} else {
    $out['Rol'] = 'website bestond al';
}

// --- 5. API-key ------------------------------------------------------------
$existingKey = $app->dataStorage->findOne('system/api_keys', ['name' => 'rolodink.app']);
if (!$existingKey) {
    $apiKey = 'API-' . randomToken(24);
    $key = [
        'key'       => $apiKey,
        'name'      => 'rolodink.app',
        'role'      => 'website',
        'meta'      => [],
        '_modified' => $now,
        '_created'  => $now,
    ];
    $app->dataStorage->save('system/api_keys', $key);
    $out['API-key (CMS_API_KEY)'] = $apiKey;
} else {
    $out['API-key (CMS_API_KEY)'] = $existingKey['key'] . ' (bestond al)';
}

// --- 6. config/config.php met revalidate-secret ---------------------------
$configFile = "{$root}/config/config.php";
if (!is_file($configFile)) {
    $secret = randomToken(32);
    if (!is_dir("{$root}/config")) mkdir("{$root}/config", 0755, true);
    $template = is_file(__DIR__ . '/../config/config.sample.php')
        ? file_get_contents(__DIR__ . '/../config/config.sample.php')
        : file_get_contents("{$root}/config/config.sample.php");
    $config = str_replace(
        ["'VUL-HIER-HET-SECRET-IN'", "https://rolodink.app/api/revalidate"],
        ["'{$secret}'", "{$siteUrl}/api/revalidate"],
        (string) $template
    );
    file_put_contents($configFile, $config);
    $out['Revalidate-secret (CMS_REVALIDATE_SECRET)'] = $secret;
} else {
    $cfg = include_once $configFile;
    $out['Revalidate-secret (CMS_REVALIDATE_SECRET)'] = ($cfg['rolodink']['revalidate_secret'] ?? '?') . ' (config.php bestond al)';
}

// Caches verversen zodat de admin en de API de nieuwe onderdelen direct zien.
$app->helper('locales')->cache();
$app->helper('api')->cache();
$app->helper('content.model')->cache();

echo "\nRolodink CMS is ingericht.\n\n";
foreach ($out as $k => $v) {
    printf("  %-44s %s\n", $k . ':', $v);
}
echo "\nBewaar de API-key en het secret: die komen in Vercel (project website).\n";
echo "Wijzig het tijdelijke wachtwoord na de eerste login.\n\n";
