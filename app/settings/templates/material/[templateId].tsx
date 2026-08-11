import { useLocalSearchParams } from 'expo-router';

import { MaterialTemplateEditorScreen } from '@/src/screens/settings/TemplateEditorScreen';

export default function EditMaterialTemplateRoute() {
  const { templateId } = useLocalSearchParams<{ templateId: string }>();

  return <MaterialTemplateEditorScreen mode="edit" templateId={templateId ?? ''} />;
}
