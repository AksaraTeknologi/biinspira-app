<?php

namespace App\Events;

use App\Models\RevisionComment;
use App\Models\RevisionRequest;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CommentPosted implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $ticketId;
    public string $ticketTitle;
    public array $commentData;
    public array $recipientIds;

    public function __construct(RevisionRequest $ticket, RevisionComment $comment, array $recipientIds = [])
    {
        $this->ticketId = $ticket->id;
        $this->ticketTitle = $ticket->title;
        $this->recipientIds = $recipientIds;
        $this->commentData = [
            'id'         => $comment->id,
            'body'       => $comment->body,
            'user_id'    => $comment->user_id,
            'user_name'  => $comment->user?->name ?? 'User',
            'created_at' => $comment->created_at?->diffForHumans() ?? 'Baru saja',
        ];
    }

    public function broadcastOn(): array
    {
        $channels = [
            new PrivateChannel('tickets.' . $this->ticketId),
        ];

        foreach ($this->recipientIds as $recipientId) {
            $channels[] = new PrivateChannel('App.Models.User.' . $recipientId);
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'comment.posted';
    }

    public function broadcastWith(): array
    {
        return [
            'ticket_id'     => $this->ticketId,
            'ticket_title'  => $this->ticketTitle,
            'comment'       => $this->commentData,
            'recipient_ids' => $this->recipientIds,
        ];
    }
}
