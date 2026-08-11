export const research = {
  date: 'REPLACE_WITH_CURRENT_DATE',
  title: 'REPLACE_WITH_RESEARCH_TITLE',
  summary: 'REPLACE_WITH_CONCISE_SYNTHESIS',
  pattern: ['REPLACE_STEP_1', 'REPLACE_STEP_2', 'REPLACE_STEP_3'],
  lead: {
    id: 'REPLACE_LEAD_TWEET_ID',
    author: 'REPLACE_LEAD_AUTHOR',
    label: 'REPLACE_LEAD_LABEL',
  },
  sections: [
    {
      eyebrow: 'REPLACE_SECTION_EYEBROW',
      title: 'REPLACE_SECTION_TITLE',
      tweets: [
        { id: 'REPLACE_TWEET_ID_1', author: 'REPLACE_AUTHOR_1' },
      ],
    },
  ],
  selectionNote: 'REPLACE_WITH_SELECTION_CRITERION',
  reviewedPosts: {
    notNoise: [
      {
        id: 'REPLACE_RELEVANT_TWEET_ID_1',
        author: 'REPLACE_RELEVANT_AUTHOR_1',
        note: 'REPLACE_WITH_WHY_THIS_POST_WAS_RELEVANT',
      },
    ],
    noise: [
      {
        id: 'REPLACE_NOISE_TWEET_ID_1',
        author: 'REPLACE_NOISE_AUTHOR_1',
        note: 'REPLACE_WITH_WHY_THIS_POST_WAS_NOISE',
      },
    ],
  },
}
