import React from 'react';
import { useUtterances } from '../../util/useUtterances';

const commentNodeId = 'comments';

const Comments = () => {
  useUtterances(commentNodeId);
  return <div id={commentNodeId} />;
};

export default Comments;
