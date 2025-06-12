<?php

use App\Http\Controllers\Dashboard\DashboardController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::group(['prefix' => 'dashboard'], function () {
    Route::get('createDashboard', [DashboardController::class, 'viewCreateDashboard'])
        ->name('dash.createDashboard');

    Route::get('upload', [DashboardController::class, 'viewUpload'])
        ->name('dash.upload');

    Route::get('home', [DashboardController::class, 'index'])
        ->name('dash.home');

    Route::get('viewPreview/{id}', [DashboardController::class, 'viewPreview'])
        ->name('dash.viewPreview');

    Route::post('uploadFile', [DashboardController::class, 'uploadFile'])
        ->name('dash.uploadFile');

    Route::post('widgetData', [DashboardController::class, 'getWidgetData'])
        ->name('dash.widgetData');

    Route::post('save', [DashboardController::class, 'save'])
        ->name('dash.save');

    Route::delete('delete/{id}', [DashboardController::class, 'delete'])
        ->name('dash.delete');
});
