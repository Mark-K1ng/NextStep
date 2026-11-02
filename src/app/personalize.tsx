import { EDUCATION_ROUTES_ENABLED } from '@/constants/education-rollout';
import QuestionnaireLibrary from '@/features/personalization/QuestionnaireLibrary';
import Questionnaire from '@/features/personalization/Questionnaire';
export default function Personalize() {
  return EDUCATION_ROUTES_ENABLED ? (
    <QuestionnaireLibrary />
  ) : (
    <Questionnaire />
  );
}
