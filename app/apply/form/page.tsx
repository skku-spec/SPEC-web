import { getFormFields } from '@/lib/actions/form-builder';
import { RECRUITMENT_BATCH } from '@/lib/recruitment-schedule';
import ApplicationFormClient from './client-form';

const FALLBACK_FORM_FIELDS = [
  {
    id: 'q1',
    label: 'Q1. 왜 창업인가요?',
    type: 'textarea',
    placeholder: '창업에 관심을 가지게 된 배경, 해결하고 싶은 문제, 또는 만들고 싶은 가치에 대해 작성해주세요.',
    minLength: 50,
    required: true,
  },
  {
    id: 'q2',
    label: 'Q2. 지금까지 직접 해본 것들을 알려주세요.',
    type: 'textarea',
    placeholder: '진행한 프로젝트, 참여한 활동, 운영 경험 등을 구체적으로 작성해주세요.',
    minLength: 50,
    required: true,
  },
  {
    id: 'q3',
    label: 'Q3. SPEC에서의 30주가 끝난 후, 어떤 모습이고 싶나요?',
    type: 'textarea',
    placeholder: 'SPEC 활동을 통해 달성하고 싶은 구체적인 목표나 변화를 작성해주세요.',
    minLength: 50,
    required: true,
  },
  {
    id: 'q4',
    label: 'Q4. SPEC은 매주 금요일 정기 활동을 진행합니다. 참여 가능 여부와 각오를 알려주세요.',
    type: 'textarea',
    placeholder: '금요일 정기 활동 참여 가능 여부와 함께, 활동에 임하는 자세를 작성해주세요.',
    minLength: 10,
    required: true,
  },
  {
    id: 'q5',
    label: 'Q5. 팀에서 본인은 어떤 사람인가요?',
    type: 'textarea',
    placeholder: '팀 프로젝트에서 주로 맡는 역할, 갈등 해결 방식, 협업 시 중요하게 생각하는 가치 등을 작성해주세요.',
    minLength: 50,
    required: true,
  },
  {
    id: 'q6',
    label: 'Q6. 마지막으로 하고 싶은 말이 있다면 자유롭게 작성해주세요. (선택)',
    type: 'textarea',
    placeholder: '포트폴리오 링크, 추가 어필 사항, 또는 궁금한 점이 있다면 작성해주세요.',
    required: false,
  },
];

export default async function ApplicationFormPage() {
  const result = await getFormFields(RECRUITMENT_BATCH.value);
  const dbFields = result.data ?? [];
  const hasDbFields = dbFields.length > 0;

  const displayFields = hasDbFields ? dbFields : FALLBACK_FORM_FIELDS;

  return <ApplicationFormClient dbFields={displayFields} />;
}
