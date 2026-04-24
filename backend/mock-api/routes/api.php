<?php
use App\Http\Controllers\Api\AuthController;
use Illuminate\Http\Request;
use App\Http\Controllers\Api\TenantController;
use App\Http\Controllers\Api\ServiceController;
use App\Http\Controllers\Api\AssignmentController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\PayableController;
use App\Http\Controllers\Api\PayablePaymentController;
use App\Http\Controllers\Api\DashboardController;


Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->get('/me', function (Request $request) {
    return $request->user();
});
Route::middleware('auth:sanctum')->post('/logout', [AuthController::class, 'logout']);
Route::middleware('auth:sanctum')->group(function () {

    Route::get('/dashboard', [DashboardController::class, 'index']);

    Route::apiResource('tenants', TenantController::class);
    Route::apiResource('services', ServiceController::class);
    Route::get('/assignments', [AssignmentController::class, 'index']);
    Route::post('/assignments/toggle', [AssignmentController::class, 'toggle']);
    Route::post('/assignments/update', [AssignmentController::class, 'update']);

    Route::apiResource('invoices', InvoiceController::class);
    Route::get('/invoices-tenant-services/{tenantId}', [InvoiceController::class, 'tenantServices']);

    Route::apiResource('payables', PayableController::class);
    Route::get('/payables/{payableId}/payments', [PayablePaymentController::class, 'index']);
    Route::post('/payables/{payableId}/payments', [PayablePaymentController::class, 'store']);
    Route::put('/payable-payments/{id}', [PayablePaymentController::class, 'update']);

});
