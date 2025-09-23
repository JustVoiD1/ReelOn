export const followUser = async (followingId: string) => {
    try {
        const response = await fetch('/api/follow', {
            method: 'POST',
            headers: {
                'Content-type': 'application/json'
            },
            body: JSON.stringify({followingId})
        })
        const data = await response.json()
        return data;
    } catch (err) {
        console.error('Following Error: ', err);
        return {success: false, error: 'Network error'};
    }
}

export const unfollowUser = async (followingId: string) => {
    try {
        const response = await fetch(`/api/follow?followingId=${followingId}`, {
            method: 'DELETE',
        })
        const data = await response.json();
        return data;

    } catch (err) {
        console.error('Unfollowing Error', err);
        return {success: false, error: 'Network error'};
    }
}


export const likeVideo = async (videoId: string) => {
    try {
        const response = await fetch('/api/like', {
            method: 'POST',
            headers: {
                'Content-type': 'application/json'
            },
            body: JSON.stringify({videoId})
        })
        const data = await response.json()
        return {success: true, ...data};
    } catch (err) {
        console.error('Like error: ', err)
        return {success: false, error: 'Network error'}
    }
}


export const likeComment = async (commentId: string) => {
    try {
        const response = await fetch('/api/like', {
            method: 'POST',
            headers: {
                'Content-type': 'application/json'
            },
            body: JSON.stringify({commentId})
        })
        const data = await response.json()
        return data;
    } catch (err) {
        console.error('Like error: ', err)
        return {success: false, error: 'Network error'}
    }
}

export const addComment = async (videoId: string, content: string) => {
    try {
        const response = await fetch('/api/comment', {
            method : 'POST',
            headers: {
                'Content-type': 'application/json'
            },
            body: JSON.stringify({videoId, content})
        })

        const data = await response.json()
        return data;
    } catch (err) {
        console.error('Comment error: ', err);
        return {success: false, error: 'Network error'};
    }
}

export const getComments = async (videoId: string) => {
    try {
        const response = await fetch(`/api/comment?videoId=${videoId}`);
        const data = await response.json();
        return data;
    } catch (err) {
        console.error('Error while getting comments', err);
        return {success: false, error: 'Network error'}
    }
}


export const checkFollowing = async (userId: string) => {
    try {
        const response = await fetch(`/api/follow/check?userId=${userId}`);
        const data = await response.json()
        return data;
    } catch (err) {
        console.error('Error while checking follow: ', err)
        return {success: false, error: 'Network error'};
    }
}


export const checkLiked = async (videoId: string) => {
    try {
        const response = await fetch(`/api/like/check?videoId=${videoId}`);
        const data = await response.json()
        return data;
    } catch (err) {
        console.error('Error while checking liked: ', err)
        return {success: false, error: 'Network error'};
    }
}

export const checkCommentLiked = async (commentId: string) => {
    try {
        const response = await fetch(`/api/like/check?commentId=${commentId}`);
        const data = await response.json()
        return data;
    } catch (err) {
        console.error('Error while checking comment liked: ', err)
        return {success: false, error: 'Network error'};
    }
}