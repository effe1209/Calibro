import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export async function triggerLightImpact() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch (error) {
    console.error('Impossibile attivare il feedback aptico:', error);
  }
}

export async function triggerSelectionFeedback() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await Haptics.selectionChanged();
  } catch (error) {
    console.error('Impossibile attivare il feedback di selezione:', error);
  }
}
