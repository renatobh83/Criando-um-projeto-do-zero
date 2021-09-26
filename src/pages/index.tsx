import React, { useState } from 'react';
import { GetStaticProps } from 'next';
import Link from 'next/link';
import { getPrismicClient } from '../services/prismic';
import Prismic from '@prismicio/client';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { getPosts } from '../util/getPosts';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
  preview: boolean;
}

export default function Home({ postsPagination, preview }: HomeProps) {
  const [isActive, setIsActive] = useState(!!postsPagination.next_page);
  const [posts, setPosts] = useState(postsPagination.results || []);
  const [nextPage, setNextPage] = useState(postsPagination.next_page || null);

  async function handleNewPosts() {
    const response = await fetch(nextPage);
    const data = await response.json();
    const newPost = getPosts(data.results);
    setPosts([...posts, newPost[0]]);
    if (!data.next_page) {
      setIsActive(false);
    }
    setNextPage(data.next_page);
  }

  return (
    <>
      <main className={commonStyles.container}>
        <div className={styles.content}>
          {posts.map(post => (
            <div className={commonStyles.post} key={post.uid}>
              <Link href={`/post/${post.uid}`}>
                <a>
                  <strong>{post.data.title}</strong>
                  <p>{post.data.subtitle}</p>
                  <div className={commonStyles.data}>
                    <div className={commonStyles.group}>
                      <FiCalendar className={commonStyles.icon} />
                      <time>
                        {format(
                          new Date(post.first_publication_date),
                          'dd LLL yyyy',
                          {
                            locale: ptBR,
                          }
                        )}
                      </time>
                    </div>
                    <div className={`${commonStyles.group} ${styles.mr}`}>
                      <FiUser className={commonStyles.icon} />
                      <span>{post.data.author}</span>
                    </div>
                  </div>
                </a>
              </Link>
            </div>
          ))}
          {isActive && (
            <button type="button" onClick={handleNewPosts}>
              Carregar mais posts
            </button>
          )}
          {preview && (
            <aside className={styles.button}>
              <Link href="/api/exit-preview">
                <a>Sair do modo Preview</a>
              </Link>
            </aside>
          )}
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({
  preview = false,
  previewData = {},
}) => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      fetch: ['post.title', 'post.author', 'post.subtitle'],
      pageSize: 1,
      ref: previewData?.ref ?? null,
    }
  );
  const next_page = postsResponse.next_page;

  const posts = getPosts(postsResponse.results);
  console.log(postsResponse);
  const postsPagination = {
    next_page,
    results: posts,
  };

  return {
    props: {
      postsPagination,
      preview,
    },
    revalidate: 60
  };
};
