import { GetStaticPaths, GetStaticProps } from 'next';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { getPrismicClient } from '../../services/prismic';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      };
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  console.log(post);

  return (
    <>
      <div className={styles.banner}>
        <img src={post.data.banner.url} alt="" />
      </div>
      <div className={commonStyles.container}>
        <h1>{post.data.title}</h1>
        <div className={commonStyles.data}>
          <div className={commonStyles.group}>
            <FiCalendar className={commonStyles.icon} />{' '}
            <time>
              {format(new Date(post.first_publication_date), 'dd LLL yyyy', {
                locale: ptBR,
              })}
            </time>
          </div>
          <div className={commonStyles.group}>
            <FiUser className={commonStyles.icon} />
            <span>{post.data.author}</span>
          </div>
          <div className={commonStyles.group}>
            <FiClock className={commonStyles.icon} />
            <span>Tempo</span>
          </div>
        </div>
        <div className={styles.postContent}>
          {post.data.content.map(p => (
            <>
              <h3>{p.heading}</h3>
              <p>{p.body.text}</p>
            </>
          ))}
        </div>
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'post'),
  ]);
  const paths = posts.results.map(post => ({
    params: { slug: post.uid },
  }));
  return {
    paths,
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const { params } = context;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(params.slug), {});
  const content = response.data.content.map(c => ({
    heading: c.heading,
    body: {
      text: c.body.find(content => content.type === 'paragraph')?.text ?? '',
    },
  }));

  const post = {
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      banner: { url: response.data.banner.url },
      author: RichText.asText(response.data.author),
      content,
    },
  };

  // TODO
  return {
    props: { post },
  };
};
