<?php
use App\Http\Controllers\Dashboard\DashboardController;
use Illuminate\Support\Facades\Route;

//Route::post('processDataReportApi', [DashboardController::class, 'processDataFromReportApi'])
//    ->name('dash.processDataReportApi');
//
//Route::get('createApi', [DashboardController::class, 'viewCreateApi'])
//    ->name('dash.createApi');
//


Route::group(['prefix' => 'api'], function () {
    Route::post('processDataReportApi', [DashboardController::class, 'processDataFromReportApi'])
        ->name('dash.processDataReportApi');

//    Route::get('createApi', [DashboardController::class, 'viewCreateApi'])
//        ->name('dash.createApi');

});
