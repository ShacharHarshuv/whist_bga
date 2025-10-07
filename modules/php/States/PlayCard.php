<?php

declare(strict_types=1);

namespace Bga\Games\israeliwhist\States;

use Bga\GameFramework\StateType;
use Bga\Games\israeliwhist\Game;

class PlayCard extends \Bga\GameFramework\States\GameState
{
    public function __construct(protected Game $game)
    {
        parent::__construct($game, id: 34, type: StateType::GAME);
    }

    function onEnteringState(): string
    {
        // This state is entered after a card is played
        // Move to next player logic
        return NextPlayer::class;
    }
}
