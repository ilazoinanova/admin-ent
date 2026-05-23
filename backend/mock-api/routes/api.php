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
use App\Http\Controllers\Api\TenantDepartmentController;
use App\Http\Controllers\Api\TenantBillingConfigController;
use App\Http\Controllers\Api\QuoteController;
use App\Http\Controllers\Api\LicenseBillingController;
use App\Http\Controllers\Api\IntegrationBillingController;
use App\Http\Controllers\Api\PaymentPeriodController;


Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->get('/me', function (Request $request) {
    return $request->user();
});
Route::middleware('auth:sanctum')->post('/logout', [AuthController::class, 'logout']);
Route::middleware('auth:sanctum')->group(function () {

    Route::get('/dashboard', [DashboardController::class, 'index']);

    Route::apiResource('tenants', TenantController::class);
    Route::get('/tenants/{tenantId}/departments', [TenantDepartmentController::class, 'index']);
    Route::post('/tenants/{tenantId}/departments', [TenantDepartmentController::class, 'store']);
    Route::put('/tenants/{tenantId}/departments/{id}', [TenantDepartmentController::class, 'update']);
    Route::delete('/tenants/{tenantId}/departments/{id}', [TenantDepartmentController::class, 'destroy']);
    Route::get('/tenants/{tenantId}/billing-config', [TenantBillingConfigController::class, 'show']);
    Route::put('/tenants/{tenantId}/billing-config', [TenantBillingConfigController::class, 'upsert']);
    Route::apiResource('services', ServiceController::class);
    Route::get('/assignments', [AssignmentController::class, 'index']);
    Route::post('/assignments/toggle', [AssignmentController::class, 'toggle']);
    Route::post('/assignments/update', [AssignmentController::class, 'update']);

    Route::apiResource('invoices', InvoiceController::class);
    Route::get('/invoices-tenant-services/{tenantId}', [InvoiceController::class, 'tenantServices']);

    Route::apiResource('quotes', QuoteController::class);
    Route::get('/quotes-tenant-services/{tenantId}', [QuoteController::class, 'tenantServices']);

    Route::get('/billing/license-preview', [LicenseBillingController::class, 'preview']);
    Route::get('/billing/integration-preview', [IntegrationBillingController::class, 'preview']);
    Route::get('/billing/integration-documents', [IntegrationBillingController::class, 'documents']);

    Route::apiResource('payables', PayableController::class);
    Route::get('/payable-payments', [PayablePaymentController::class, 'indexAll']);
    Route::get('/payables/{payableId}/payments', [PayablePaymentController::class, 'index']);
    Route::post('/payables/{payableId}/payments', [PayablePaymentController::class, 'store']);
    Route::post('/payable-payments/{id}', [PayablePaymentController::class, 'update']);   // POST con _method=PUT para soportar multipart
    Route::put('/payable-payments/{id}', [PayablePaymentController::class, 'update']);
    Route::get('/payable-payments/{id}/comprobante', [PayablePaymentController::class, 'comprobante']);

    Route::apiResource('payment-periods', PaymentPeriodController::class)->except(['show']);
    Route::post('/payment-periods/{id}/toggle-active', [PaymentPeriodController::class, 'toggleActive']);
    Route::post('/payment-periods/{id}/initialize',    [PaymentPeriodController::class, 'initialize']);

    Route::post('/payable-payments/additional', [PayablePaymentController::class, 'storeAdditional']);

});
