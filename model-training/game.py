import random


class Game:

    def __init__(self):

        self.score = 0

        self.round = 0

        self.max_rounds = 10

        self.questions = []

        self.correct_answers = 0

        self.streak = 0

        self.time_limit = 30

    def start(self, labels):

        self.score = 0
        self.round = 0
        self.correct_answers = 0
        self.streak = 0

        # Use every available label once per game.
        self.questions = random.sample(labels, len(labels))

        # One round for each object the model recognizes (currently 20).
        self.max_rounds = len(self.questions)
        self.time_limit = 30

    def current_prompt(self):

        if self.round < len(self.questions):
            return self.questions[self.round]

        return ""

    def next_round(self):

        self.round += 1

    def finished(self):

        return self.round >= self.max_rounds

    def add_score(self, points):

        self.score += points

        self.correct_answers += 1

        self.streak += 1

    def wrong_answer(self):

        self.streak = 0

    def accuracy(self):

        if self.round == 0:
            return 0

        return round(
            (self.correct_answers / self.round) * 100,
            2
        )
