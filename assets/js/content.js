// Add publication metadata and video paths here when they are ready.
// Empty paths deliberately display placeholders and make no media requests.
window.VideoPhysEditContent = {
  paper: null,
  arxiv: null,
  authors: [], // Example shape: { name: "...", url: "...", affiliation: "1" }
  affiliations: [],
  bibtex: "",
  teaser: { source: null, result: null },
  editGroups: {
    composition: [
      { id: "insertion", label: "Object insertion", description: "Insert an object and infer the new collisions and downstream interactions.", source: null, result: null },
      { id: "removal", label: "Object removal", description: "Remove an object and infer how the motion of the remaining objects changes.", source: null, result: null }
    ],
    motion: [
      { id: "velocity", label: "Initial velocity", description: "Change an object's initial velocity and infer the resulting motion and interactions.", source: null, result: null }
    ],
    parameters: [
      { id: "mass", label: "Mass", description: "Change an object's mass and infer how it affects subsequent collisions.", source: null, result: null },
      { id: "friction", label: "Friction", description: "Change friction and infer how the motion of the objects changes.", source: null, result: null },
      { id: "restitution", label: "Restitution", description: "Change restitution and infer the resulting rebound motion and interactions.", source: null, result: null }
    ]
  },
  comparisons: {
    synthetic: [
      { name: "Source", role: "source", video: null },
      { name: "VACE", video: null },
      { name: "Ditto", video: null },
      { name: "MiniMax H3", video: null },
      { name: "Seedance 2.5", video: null },
      { name: "VideoPhysEdit", role: "ours", video: null }
    ],
    real: [
      { name: "Source", role: "source", video: null },
      { name: "VACE", video: null },
      { name: "Ditto", video: null },
      { name: "MiniMax H3", video: null },
      { name: "Seedance 2.5", video: null },
      { name: "VideoPhysEdit", role: "ours", video: null }
    ],
    removal: [
      { name: "Source", role: "source", video: null },
      { name: "VOID", video: null },
      { name: "MiniMax H3", video: null },
      { name: "Seedance 2.5", video: null },
      { name: "Ditto", video: null },
      { name: "VideoPhysEdit", role: "ours", video: null }
    ]
  }
};
