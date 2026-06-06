<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ $invoice->invoice_number }}</title>
</head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:Arial,Helvetica,sans-serif;color:#333;">
  <div style="max-width:680px;margin:24px auto;padding:0 16px;">

    {{-- Cuerpo del mensaje --}}
    <div style="background:#fff;border-radius:10px;padding:28px 28px 20px;margin-bottom:16px;border:1px solid #e0e0e0;">
      <p style="margin:0 0 8px;font-size:14px;line-height:1.6;white-space:pre-line;">{!! nl2br(e($emailBody)) !!}</p>
    </div>

    {{-- Card de referencia --}}
    <div style="background:#fff;border-radius:10px;overflow:hidden;margin-bottom:16px;border:1px solid #e0e0e0;">

      {{-- Encabezado --}}
      <div style="background:#0b1b3b;padding:10px 20px;">
        <span style="color:#fff;font-size:11px;font-weight:bold;letter-spacing:1px;">DETALLE DE REFERENCIA</span>
      </div>

      {{-- Datos de la factura --}}
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <tr>
          <td style="padding:9px 20px;font-weight:bold;color:#0b3e91;width:140px;border-bottom:1px solid #f0f0f0;">Nº Factura</td>
          <td style="padding:9px 20px;font-weight:bold;color:#1a1a1a;border-bottom:1px solid #f0f0f0;">{{ $invoice->invoice_number }}</td>
          <td style="padding:9px 20px;font-weight:bold;color:#0b3e91;width:130px;border-bottom:1px solid #f0f0f0;">Período</td>
          <td style="padding:9px 20px;color:#444;border-bottom:1px solid #f0f0f0;">{{ $periodLabel }}</td>
        </tr>
        <tr style="background:#f9fafb;">
          <td style="padding:9px 20px;font-weight:bold;color:#0b3e91;">Fecha emisión</td>
          <td style="padding:9px 20px;color:#444;">{{ $invoice->issue_date?->format('d/m/Y') ?? '—' }}</td>
          <td style="padding:9px 20px;font-weight:bold;color:#0b3e91;">Vencimiento</td>
          <td style="padding:9px 20px;color:#444;">{{ $invoice->due_date?->format('d/m/Y') ?? '—' }}</td>
        </tr>
      </table>

      @if($invoice->items->isNotEmpty())
      {{-- Sección de servicios --}}
      <div style="background:#0b3e91;padding:8px 20px;">
        <span style="color:#fff;font-size:11px;font-weight:bold;letter-spacing:1px;">DESCRIPCIÓN DE SERVICIOS</span>
      </div>
      @foreach($invoice->items as $i => $item)
      <div style="padding:9px 20px;font-size:13px;color:#333;{{ $loop->last ? '' : 'border-bottom:1px solid #f0f0f0;' }}{{ $i % 2 === 1 ? 'background:#f9fafb;' : '' }}">
        {{ $item->description }}
      </div>
      @endforeach
      @endif

    </div>

    {{-- Footer --}}
    @if(trim($emailFooter))
    <div style="background:#fff;border-radius:10px;padding:16px 20px;color:#888;font-size:12px;line-height:1.5;border:1px solid #e0e0e0;">
      {!! nl2br(e($emailFooter)) !!}
    </div>
    @endif

    <p style="text-align:center;color:#bbb;font-size:11px;margin-top:24px;">
      Este correo fue generado automáticamente. Por favor no responda a este mensaje.
    </p>

  </div>
</body>
</html>
