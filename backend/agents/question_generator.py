import json
import random
from difflib import SequenceMatcher

class QuestionGenerator:
    def __init__(self, candidate_level=None):
        self.candidate_level = candidate_level

    def generate_questions(self):
        questions = []
        question_types = {'single_choice': 4, 'multiple_choice': 3, 'code_fill': 3}

        # Generate questions based on the defined distribution
        for qtype, count in question_types.items():
            for _ in range(count):
                question = self.create_question(qtype)
                if question:
                    questions.append(question)

        # Ensure unique questions
        unique_questions = self.deduplicate(questions)

        # Regenerate if we have insufficient unique questions
        while len(unique_questions) < 10:
            unique_questions.extend(self.generate_questions())
            unique_questions = self.deduplicate(unique_questions)

        # Normalize output to frontend schema
        normalized_questions = self.normalize_questions(unique_questions)
        return json.dumps({'questions': normalized_questions})

    def create_question(self, qtype):
        # Placeholder for question creation logic
        return {
            'id': self.generate_id(),
            'text': f'Example {qtype} question',
            'type': qtype,
            'options': ['Option 1','Option 2'],
            'difficulty': self.get_difficulty(),
            'time_limit': 30,
            'category': 'General',
            'placeholder': 'Enter your answer here',
            'code_snippet': 'print("Hello, World!")'
        }

    def deduplicate(self, questions):
        unique_questions = []
        seen = set()
        for question in questions:
            question_tuple = tuple(question.items())
            if question_tuple not in seen:
                seen.add(question_tuple)
                unique_questions.append(question)
        return unique_questions[:10]

    def normalize_questions(self, questions):
        for question in questions:
            question['text'] = question['text']
            question['difficulty'] = self.adjust_difficulty(question['difficulty'])
        return questions

    def generate_id(self):
        return random.randint(1, 10000)

    def get_difficulty(self):
        # Placeholder for difficulty level adjustment based on candidate_level
        return 'medium' if self.candidate_level is None else self.candidate_level

    def adjust_difficulty(self, difficulty):
        # Logic for adjusting difficulty based on candidate level
        if self.candidate_level == 'easy':
            return 'easy'
        elif self.candidate_level == 'hard':
            return 'hard'
        return difficulty

# Example of how to use the QuestionGenerator
if __name__ == '__main__':
    generator = QuestionGenerator(candidate_level='hard')
    print(generator.generate_questions())