<?php

namespace App\Mail;

use App\Models\Invoice;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class InvoiceClientMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Invoice $invoice,
        public string  $emailSubject,
        public string  $emailBody,
        public string  $emailFooter,
        public string  $pdfPath,
        public string  $pdfFileName,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: $this->emailSubject);
    }

    public function content(): Content
    {
        return new Content(view: 'emails.invoice_client', with: [
            'invoice'      => $this->invoice,
            'emailBody'    => $this->emailBody,
            'emailFooter'  => $this->emailFooter,
            'periodLabel'  => $this->resolvePeriodLabel(),
        ]);
    }

    public function attachments(): array
    {
        return [
            Attachment::fromPath($this->pdfPath)
                ->as($this->pdfFileName)
                ->withMime('application/pdf'),
        ];
    }

    private function resolvePeriodLabel(): string
    {
        $period = $this->invoice->billing_period;
        if (!$period) return '—';

        $months = [
            '01' => 'Enero', '02' => 'Febrero', '03' => 'Marzo',
            '04' => 'Abril', '05' => 'Mayo',    '06' => 'Junio',
            '07' => 'Julio', '08' => 'Agosto',  '09' => 'Septiembre',
            '10' => 'Octubre','11' => 'Noviembre','12' => 'Diciembre',
        ];

        [$year, $month] = explode('-', $period);
        return ($months[$month] ?? $month) . ' ' . $year;
    }
}
