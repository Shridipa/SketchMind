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

    def start(self, labels, difficulty="Easy"):

        self.score = 0
        self.round = 0
        self.correct_answers = 0
        self.streak = 0

    # Use ALL labels
        self.questions = random.sample(labels, len(labels))

    # Number of rounds
        self.max_rounds = 10

    # Take first 10 UNIQUE prompts
        self.questions = self.questions[:self.max_rounds]

        self.difficulty = difficulty
        if difficulty == "Easy":
            self.time_limit = 30

        elif difficulty == "Medium":
            self.time_limit = 20

        else:
            self.time_limit = 10

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