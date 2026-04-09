<?php

namespace App\Notifications;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class TaskStatusUpdated extends Notification
{
    protected $task;

    public function __construct($task)
    {
        $this->task = $task;
    }

    public function via($notifiable)
    {
        return ['mail'];
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('Update Status Task')
            ->greeting('Halo ' . $notifiable->name)
            ->line('Task yang anda buat telah diupdate.')
            ->line('Judul: ' . $this->task->title)
            ->line('Status Baru: ' . strtoupper($this->task->status))
            ->line('Terima kasih.');
    }
}