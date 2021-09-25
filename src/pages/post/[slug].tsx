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
import Link from 'next/link';
import Comments from '../../components/comments';
import { useEffect, useState } from 'react';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
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
  listOfPost?: {
    title: string;
    slug: string;
  }[];
}

export default function Post({ post, listOfPost }: PostProps) {
  const router = useRouter();
  const [nextPost, setNextPost] = useState(true);
  const [prevPost, setPrevPost] = useState(true);
  const [titleNext, setTitleNext] = useState({ title: '', slug: '' });
  const [titlePrev, setTitlePrev] = useState({ title: '', slug: '' });

  useEffect(() => {
    const index = listOfPost.findIndex(uid => uid.title === post.data.title);

    if (index === 0) {
      setPrevPost(false);
      setTitleNext({
        title: listOfPost[index + 1].title,
        slug: listOfPost[index + 1].slug,
      });
    } else if (index === listOfPost.length - 1) {
      setTitlePrev({
        title: listOfPost[index - 1].title,
        slug: listOfPost[index - 1].slug,
      });

      setNextPost(false);
    } else {
      setNextPost(true);
      setPrevPost(true);
      setTitlePrev({
        title: listOfPost[index - 1].title,
        slug: listOfPost[index - 1].slug,
      });
      setTitleNext({
        title: listOfPost[index + 1].title,
        slug: listOfPost[index + 1].slug,
      });
    }
  }, [router.asPath]);

  function calcTime(data) {
    let time = 0;

    const wordsPerMinute = 200;
    let count = data.reduce((sum, ct) => {
      const textBody = PrismicDOM.RichText.asText(ct.body).split(/[\s]+/g);
      const textHeadind = ct.heading;

      sum += textHeadind?.length;
      sum += textBody?.length;

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
        <div style={{ marginTop: '2rem' }}>
          <time>
            * editado em{' '}
            {format(
              new Date(post.last_publication_date),
              " dd 'de' LLL yyyy', às ' HH:mm'",
              {
                locale: ptBR,
              }
            )}
          </time>
        </div>

        <div className={styles.postContent}>
          {post.data.content.map(p => (
            <div key={p.heading}>
              <h3>{p.heading}</h3>
              <div
                dangerouslySetInnerHTML={{
                  __html: PrismicDOM.RichText.asHtml(p.body),
                }}
              ></div>
            </div>
          ))}
        </div>
        <div className={styles.commentPage}>
          <div className={styles.actions}>
            {prevPost ? (
              <div className={styles.action}>
                <span>{titlePrev.title}</span>
                <Link href={`/post/${titlePrev.slug}`}>
                  <button type="button" className={styles.exit}>
                    Post anterior
                  </button>
                </Link>
              </div>
            ) : (
              <div></div>
            )}
            <div></div>
            {nextPost && (
              <div className={styles.action}>
                <span>{titleNext.title}</span>
                <Link href={`/post/${titleNext.slug}`}>
                  <button type="button" className={styles.exit}>
                    Próximo post
                  </button>
                </Link>
              </div>
            )}
          </div>
          <Comments />
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
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      fetch: ['post.title'],
    }
  );

  const listOfPost = postsResponse.results.map(post => ({
    title: post.data.title,
    slug: post.uid,
  }));

  return {
    props: { post: response, listOfPost },
    revalidate: 60 * 60 * 24,
  };
};
