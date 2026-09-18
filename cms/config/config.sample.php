<?php
// Cockpit-configuratie voor cms.rolodink.app.
// Kopieer naar config/config.php in de webroot en vul de placeholders in.
// config.php hoort NIET in versiebeheer (bevat het revalidate-secret).

return [

    'app.name' => 'Rolodink CMS',

    // Alleen afbeeldingen uploaden; de website toont ze via next/image.
    'assets/allowed_uploads' => 'jpg,jpeg,png,webp,avif,svg',

    // Rolodink-specifiek (gebruikt door config/bootstrap.php).
    'rolodink' => [
        // Endpoint op de website dat de Next.js Data Cache leegt.
        'revalidate_url'    => 'https://rolodink.app/api/revalidate',
        // Moet gelijk zijn aan CMS_REVALIDATE_SECRET in Vercel. Bijv.: openssl rand -hex 32
        'revalidate_secret' => 'VUL-HIER-HET-SECRET-IN',
        // Modellen waarvan wijzigingen de website verversen.
        'models'            => ['over'],
    ],
];
