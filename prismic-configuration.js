module.exports = {
  apiEndpoint: 'https://blogdesafiorocket.prismic.io/api/v2',
  repoName: 'blogDesafioRocket',
  linkResolver: function (doc) {
    if (doc.isBroken) {
      return '/not-found';
    }

    if (doc.type === 'post') {
      return '/post/' + doc.uid;
    }
    return '/';
  },
};
