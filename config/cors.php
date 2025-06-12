<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Aquí puedes configurar los ajustes CORS para tu aplicación.
    | Puedes permitir orígenes específicos, métodos, headers, etc.
    |
    */

    'paths' => [
        'api/*',
        'sanctum/csrf-cookie',
    ],

    'allowed_methods' => ['*'], // o ['GET', 'POST', 'PUT', 'DELETE']

    'allowed_origins' => ['*'], // O restringir: ['http://localhost:3000']

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'], // O específicos como ['Content-Type', 'X-CSRF-TOKEN']

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,
];
