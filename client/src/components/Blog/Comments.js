import React, { useState, useEffect } from 'react';
import { Box, Button, TextField, Typography, Divider } from '@mui/material';

const Comments = ({ username, postId }) => {
  const [comments, setComments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState('');
  const [replyTo, setReplyTo] = useState(null);

  useEffect(() => {
    fetch(`/api/getComments/${postId}`)
      .then((res) => res.json())
      .then((data) => setComments(data))
      .catch((err) => console.error('Error fetching comments:', err));
  }, [postId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formattedContent = replyTo ? `@${replyTo.id}| ${content}` : content;

    try {
      const response = await fetch('/api/addComment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: username,
          post_id: postId,
          content: formattedContent,
        }),
      });

      if (!response.ok) throw new Error('Failed to add comment');
      const updated = await fetch(`/api/getComments/${postId}`).then((res) => res.json());
      setComments(updated);
      setContent('');
      setReplyTo(null);
      setShowForm(false);
    } catch (err) {
      console.error('Error submitting comment:', err);
    }
  };

  const parseReply = (comment) => {
    const match = comment.content.match(/^@(\d+)\|\s(.+)/);
    if (match) {
      const parentId = match[1];
      const replyText = match[2];
      return { parentId, replyText };
    }
    return null;
  };

  const inputStyles = {
    backgroundColor: '#ffffff',
    '& .MuiOutlinedInput-root': {
      '& fieldset': {
        borderColor: '#2b6777',
      },
      '&:hover fieldset': {
        borderColor: '#2b6777',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#2b6777',
      },
    },
    '& .MuiInputLabel-root': {
      color: '#2b6777',
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: '#2b6777',
    },
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Button
        variant="contained"
        onClick={() => {
          setShowForm(!showForm);
          setReplyTo(null);
        }}
        sx={{
          backgroundColor: '#52ab98',
          '&:hover': { backgroundColor: '#2b6777' },
          mb: 2,
        }}
      >
        {showForm ? 'Cancel' : 'Comment'}
      </Button>

      {showForm && (
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label={replyTo ? `Replying to ${replyTo.name}` : 'Write a comment...'}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            sx={{ mt: 1, ...inputStyles }}
          />
          <Button
            type="submit"
            variant="contained"
            sx={{
              mt: 1,
              backgroundColor: '#52ab98',
              '&:hover': { backgroundColor: '#2b6777' },
            }}
          >
            Submit
          </Button>
        </form>
      )}

      <Divider sx={{ my: 3, borderColor: '#2b6777' }} />
      <Typography variant="h6" sx={{ color: '#2b6777', fontWeight: 'bold' }}>
        Comments:
      </Typography>

      {comments.map((comment) => {
        const parsed = parseReply(comment);

        if (!parsed) {
          return (
            <Box key={comment.id} sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ color: '#2b6777' }}>
                <strong>{comment.name}</strong>: {comment.content}
              </Typography>
              <Button
                size="small"
                onClick={() => {
                  setReplyTo(comment);
                  setShowForm(true);
                }}
                sx={{
                  mt: 0.5,
                  color: '#52ab98',
                  textTransform: 'none',
                  '&:hover': { color: '#2b6777' },
                }}
              >
                Reply
              </Button>

              {comments
                .filter((reply) => reply.content.startsWith(`@${comment.id}|`))
                .map((reply) => (
                  <Box key={reply.id} sx={{ ml: 4, mt: 1 }}>
                    <Typography variant="body2" sx={{ color: '#2b6777' }}>
                      <strong>{reply.name}</strong>: {reply.content.replace(/^@\d+\|\s/, '')}
                    </Typography>
                  </Box>
                ))}
            </Box>
          );
        }

        return null;
      })}
    </Box>
  );
};

export default Comments;