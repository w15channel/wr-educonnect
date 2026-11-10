import { mergeScoreItemCsvs } from '../../../scripts/mergeScoreItems.js';

export default async function entry(req: any) {
  try {
    const result = mergeScoreItemCsvs();
    return {
      success: true,
      message: 'ScoreItem CSV files successfully merged.',
      data: result,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Failed to merge ScoreItem CSV files.',
    };
  }
}
