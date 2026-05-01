import { API_BASE_URL } from '@/services/publicApi';

export type AssessmentQuestion = {
  id: string;
  questionType: 'text' | 'image';
  content: string;
  imageFile?: File;
  answerType: 'multiple_choice' | 'open_ended';
  openEndedAnswerType?: 'text' | 'number';
  openEndedNumericAnswer?: string;
  options: string[];
  correctAnswer: number;
};

export const createAssessmentQuestionId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const createDefaultAssessmentQuestion = (id: string): AssessmentQuestion => ({
  id,
  questionType: 'text',
  content: '',
  answerType: 'multiple_choice',
  openEndedAnswerType: 'text',
  openEndedNumericAnswer: '',
  options: ['', '', '', ''],
  correctAnswer: 0,
});

const parseNumericAnswer = (value: string) => {
  const normalized = value.replace(',', '.').trim();
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

export const validateAssessmentDuration = (duration: number) => {
  if (!Number.isFinite(Number(duration))) {
    return 'Müddət düzgün daxil edilməyib.';
  }

  if (Number(duration) < 5 || Number(duration) > 180) {
    return 'Müddət 5 ilə 180 dəqiqə arasında olmalıdır.';
  }

  return null;
};

export const validateAssessmentQuestions = (questions: AssessmentQuestion[]) => {
  if (!Array.isArray(questions) || questions.length === 0) {
    return 'Ən azı bir sual əlavə edin.';
  }

  for (const [index, question] of questions.entries()) {
    const questionNumber = index + 1;
    const hasContent = Boolean(question.content?.trim()) || Boolean(question.imageFile);

    if (!hasContent) {
      return `${questionNumber}-ci sual üçün mətn və ya şəkil daxil edin.`;
    }

    if (question.answerType === 'multiple_choice') {
      if (question.options.length < 2) {
        return `${questionNumber}-ci sual üçün ən azı iki variant olmalıdır.`;
      }

      const hasEmptyOption = question.options.some((option) => !option.trim());
      if (hasEmptyOption) {
        return `${questionNumber}-ci sualın bütün variantlarını doldurun.`;
      }

      if (!question.options[question.correctAnswer]?.trim()) {
        return `${questionNumber}-ci sual üçün düzgün cavabı seçin.`;
      }
    }

    if (question.answerType === 'open_ended' && question.openEndedAnswerType === 'number') {
      if (parseNumericAnswer(question.openEndedNumericAnswer || '') === null) {
        return `${questionNumber}-ci sual üçün düzgün rəqəm cavabı daxil edin.`;
      }
    }
  }

  return null;
};

export const formatAssessmentQuestionsForApi = async (questions: AssessmentQuestion[], token: string | null) => {
  if (!token) {
    throw new Error('Sessiya tapılmadı. Yenidən daxil olun.');
  }

  const formattedQuestions = [];

  for (const question of questions) {
    let finalContent = question.content.trim();

    if (question.questionType === 'image' && question.imageFile) {
      const presignResponse = await fetch(
        `${API_BASE_URL}/upload/presign?filename=${encodeURIComponent(question.imageFile.name)}&contentType=${encodeURIComponent(question.imageFile.type)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const presignPayload = await presignResponse.json();

      if (!presignResponse.ok || presignPayload?.success === false) {
        throw new Error(presignPayload?.message || 'Sual şəkli yüklənmədi.');
      }

      const uploadResponse = await fetch(presignPayload.data.signedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': question.imageFile.type,
        },
        body: question.imageFile,
      });

      if (!uploadResponse.ok) {
        throw new Error('Sual şəkli storage-a yüklənmədi.');
      }

      finalContent = presignPayload.data.publicUrl;
    }

    formattedQuestions.push({
      questionType: question.questionType,
      content: finalContent,
      answerType: question.answerType,
      openEndedAnswerType: question.answerType === 'open_ended' ? (question.openEndedAnswerType || 'text') : 'text',
      options: question.answerType === 'multiple_choice' ? question.options.map((option) => option.trim()) : [],
      correctAnswer: question.answerType === 'multiple_choice'
        ? String(question.correctAnswer ?? 0)
        : (question.openEndedAnswerType === 'number' ? (question.openEndedNumericAnswer || '').trim().replace(',', '.') : ''),
    });
  }

  return formattedQuestions;
};