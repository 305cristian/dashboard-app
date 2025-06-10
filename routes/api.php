<?php
use App\Http\Controllers\Dashboard\DashboardController;
use Illuminate\Support\Facades\Route;

Route::post('processDataReport', [DashboardController::class, 'processDataFromReport'])
    ->name('dash.processDataReport');




