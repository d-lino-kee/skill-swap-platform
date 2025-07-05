import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Box, Typography, Card, CardContent } from '@mui/material';
import Comments from '../Blog/Comments';

const PostDetails = () => {
  const location = useLocation();
  const { username } = location.state || {};
  const { postId } = useParams();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);

  const fetchComments = useCallback(() => {
    fetch(`/api/getComments/${postId}`)
      .then(res => res.json())
      .then(data => setComments(data))
      .catch(err => console.error('Error fetching comments:', err));
  }, [postId]);

  useEffect(() => {
    fetch(`/api/getPost/${postId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setPost(data);
          fetchComments(); // Initial comment fetch
        } else {
          console.error('No data found for this post.');
        }
      })
      .catch((err) => console.error('Error fetching post:', err));
  }, [postId, fetchComments]);

  if (!post) return (
    <Typography sx={{ textAlign: 'center', mt: 4, color: '#2b6777' }}>
      Loading post {postId}...
    </Typography>
  );

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4, px: 2 }}>
      <Card sx={{ p: 3, backgroundColor: '#ffffff', borderLeft: '5px solid #52ab98' }}>
        <CardContent>
          <Typography variant="h4" sx={{ color: '#2b6777', fontWeight: 'bold' }}>
            {post.title}
          </Typography>
          <Typography variant="subtitle1" sx={{ color: '#2b6777', mb: 2 }}>
            By: {post.name} | {new Date(post.created_at).toLocaleString()}
          </Typography>
          <Typography variant="body1" sx={{ color: '#2b6777' }}>
            {post.content}
          </Typography>
        </CardContent>
      </Card>

      <Box sx={{ mt: 4 }}>
        <Comments
          username={username}
          postId={postId}
          comments={comments}
          refreshComments={fetchComments}
        />
      </Box>
    </Box>
  );
};

export default PostDetails;