import { useState } from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { getPrismicClient } from '../../services/prismic';
import Prismic from '@prismicio/client';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { format } from 'date-fns';
import PrismicDOM from 'prismic-dom';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
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
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const [time, setTime] = useState(0);
  const router = useRouter();

  function calcTime(data) {
    let time = 0;
    const wordsPerMinute = 200;
    let count = data.reduce((sum, ct) => {
      const textBody = PrismicDOM.RichText.asText(ct.body).split(/[\s]+/g);
      const textHeadind = ct.heading;

      sum += textHeadind.length;
      sum += textBody.length;

      return sum;
    }, 0);
    time = Math.ceil(count / wordsPerMinute);

    return time;
  }

  if (router.isFallback) {
    return (
      <div>
        <p>Carregando...</p>
      </div>
    );
  }
  return (
    <>
      <div className={styles.banner}>
        <img src={post.data.banner.url} alt="banner" />
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
            <span>{`${calcTime(post.data.content)} min`}</span>
          </div>
        </div>
        <div className={styles.postContent}>
          {post.data.content.map(p => (
            <div key={p.heading}>
              <h3>{p.heading}</h3>
              <p
                dangerouslySetInnerHTML={{
                  __html: PrismicDOM.RichText.asHtml(p.body),
                }}
              ></p>
            </div>
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
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(slug), {});

  return {
    props: { post: response },
    revalidate: 1,
  };
};
