<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

// Sirve el build de React (SPA con BrowserRouter) para cualquier ruta que no
// sea de la API, para que las URLs profundas (ej. /tenants) no den 404.
Route::get('/{any?}', function () {
    $index = public_path('index.html');

    if (! file_exists($index)) {
        abort(404);
    }

    return response()->file($index);
})->where('any', '^(?!api).*$');

