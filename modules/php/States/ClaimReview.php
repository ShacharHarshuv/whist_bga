<?php
declare(strict_types=1);

namespace Bga\Games\israeliwhist\States;

use Bga\GameFramework\StateType;
use Bga\Games\israeliwhist\Game;
use Bga\GameFramework\States\PossibleAction;
use Bga\Games\israeliwhist\States\TakeCards;

class ClaimReview extends \Bga\GameFramework\States\GameState
{
    public function __construct(protected Game $game)
    {
        parent::__construct(
            $game,
            id: 41,
            type: StateType::MULTIPLE_ACTIVE_PLAYER,
            description: clienttranslate(
                "All players must accpet or contest claim"
            ),
            descriptionMyTurn: clienttranslate(
                '${you} must accept or contest claim'
            )
        );
    }

    function onEnteringState(): void
    {
        $claimingPlayerId = (int) $this->game->getActivePlayerId();
        $players = array_keys($this->game->loadPlayersBasicInfos());
        $playersToActivate = array_filter(
            $players,
            fn($playerId) => $playerId != $claimingPlayerId
        );
        $this->game->gamestate->setPlayersMultiactive(
            $playersToActivate,
            "",
            true
        );
    }

    #[PossibleAction]
    public function actAccept(int $currentPlayerId)
    {
        $this->game->dump("actAccept", $currentPlayerId);
        $this->game->notify->all(
            "playerAccept",
            clienttranslate('${player_name} accepts'),
            [
                "player_id" => $currentPlayerId,
                "player_name" => $this->game->getPlayerNameById(
                    $currentPlayerId
                ),
            ]
        );
        $this->game->gamestate->setPlayerNonMultiactive(
            $currentPlayerId,
            EndClaim::class
        );
    }

    #[PossibleAction]
    public function actContest(int $currentPlayerId)
    {
        $this->game->notify->all(
            "playerContest",
            clienttranslate('${player_name} contests the claim'),
            [
                "player_id" => $currentPlayerId,
                "player_name" => $this->game->getPlayerNameById(
                    $currentPlayerId
                ),
            ]
        );
        $this->game->setGameStateValue("claimingPlayerId", 0);
        return PlayerTurn::class;
    }

    public function zombie(int $playerId)
    {
        $this->actAccept($playerId);
    }
}
