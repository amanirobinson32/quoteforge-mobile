import { useLocalSearchParams } from 'expo-router';

import { LaborTemplateEditorScreen } from '@/src/screens/settings/TemplateEditorScreen';

export default function EditLaborTemplateRoute() {
  const { templateId } = useLocalSearchParams<{ templateId: string }>();

  return <LaborTemplateEditorScreen mode="edit" templateId={templateId ?? ''} />;
}
