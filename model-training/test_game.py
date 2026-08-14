from game import Game


def test_game_uses_twenty_round_challenge_and_difficulty_time_limits():
    game = Game()
    labels = [f"label_{i}" for i in range(25)]

    game.start(labels, "Hard")

    assert game.max_rounds == 20
    assert game.time_limit == 10
    assert len(game.questions) == 20
