<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;

class VerifyCsrfToken extends Middleware
{
    /**
     * Los URIs que deben ser excluidos de la verificación CSRF.
     *
     * Usa esto solo en rutas que confíes, idealmente para testing o APIs.
     */
    protected $except = [
        'api/createApi',
        'api/processDataReportApi',
        'dashboard/widgetData'
    ];
}
