module.exports = function (app, conn) {
  /* ---------------------------------------------------------- MANAGE */
  // 테이블 리스트 관리 페이지
  app.get(['/', '/manage/table_list'], function (req, res) {
    let tables = [];
    let show_all_table_sql = 'SHOW TABLES';
    conn.query(show_all_table_sql, function (err, results) {
      if (err) {
        console.log(err);
        res.send(`<script>alert(\`${err.sqlMessage}\`)</script>`);
      } else {
        for (let result of results) {
          tables.push(result['Tables_in_bookdatabase']);
        }
        res.render('index', {
          page: 'manage/table_list',
          tables: tables,
        });
      }
    });
  });

  // 테이블 관리 페이지
  app.get('/manage/table/:table_name', function (req, res) {
    let table_name = req.params.table_name;
    let select_all_sql = `SELECT * FROM \`${table_name}\`;`;
    let rows;
    conn.query(select_all_sql, function (err, results) {
      if (err) {
        console.log(err);
        res.send(`<script>alert(\`${err.sqlMessage}\`)</script>`);
      } else {
        rows = results;
      }
      res.render('index', {
        page: 'manage/table',
        table_name: table_name,
        rows: rows,
      });
    });
  });

  /* ---------------------------------------------------------- INPUT */

  // 테이블 생성 페이지
  app.get('/input/table', function (req, res) {
    res.render('index', {
      page: 'input/table',
    });
  });

  // 테이블 생성 작업 -- 생성과 동시에 id 값만이 존재하는 더미 행이 추가됨
  app.post('/input/table', function (req, res) {
    let table_name = req.body.table_name;
    let create_table_sql = `
      CREATE TABLE \`${table_name}\` (
        id INT AUTO_INCREMENT,
        PRIMARY KEY(id)
      );
    `;
    let insert_dummy_sql = `INSERT INTO \`${table_name}\` VALUES ();`;
    conn.query(create_table_sql, function (err, results) {
      if (err) {
        console.log(err);
        res.send(`<script>alert(\`${err.sqlMessage}\`)</script>`);
      } else {
        conn.query(insert_dummy_sql, function () {
          res.redirect(`/manage/table/${table_name}`);
        });
      }
    });
  });

  // 테이블 행 생성 페이지
  app.get('/input/row/:table_name', function (req, res) {
    let columns = [];
    let table_name = req.params.table_name;
    let show_columns_sql = `
      SHOW COLUMNS FROM \`${table_name}\`;
    `;
    conn.query(show_columns_sql, function (err, results) {
      if (err) {
        console.log(err);
        res.send(`<script>alert(\`${err.sqlMessage}\`)</script>`);
      } else {
        for (let result of results) {
          if (result['Field'] !== 'id') {
            columns.push(result['Field']);
          }
        }
        res.render('index', {
          page: 'input/row',
          table_name: table_name,
          columns: columns,
        });
      }
    });
  });

  // 테이블 행 생성 작업
  app.post('/input/row/:table_name', function (req, res) {
    let table_name = req.params.table_name;
    let body = req.body;
    let columns = [];
    let values = [];
    for (let i in body) {
      columns.push(i);
      values.push(body[i]);
    }
    columns = columns.map((column) => `\`${column}\``);
    values = values.map((value) => `"${value}"`);
    let create_row_sql = `
      INSERT INTO \`${table_name}\` (${columns.join(',')}) 
      VALUES (${values.join(',')});`;
    conn.query(create_row_sql, function (err, results) {
      if (err) {
        console.log(err);
        res.send(`<script>alert(\`${err.sqlMessage}\`)</script>`);
      } else {
        res.redirect(`/manage/table/${table_name}`);
      }
    });
  });

  // 테이블 열 생성 페이지
  app.get('/input/column/:table_name', function (req, res) {
    let table_name = req.params.table_name;
    res.render('index', {
      page: 'input/column',
      table_name: table_name,
    });
  });

  // 테이블 열 생성 작업
  app.post('/input/column/:table_name', function (req, res) {
    let table_name = req.params.table_name;
    let column_name = req.body.column_name;
    let column_type = req.body.column_type;
    let key_type = req.body.key_type;
    let reference_table = req.body.reference_table;
    let add_column_sql = `
      ALTER TABLE \`${table_name}\`
      ADD COLUMN \`${column_name}\` ${column_type};
    `;
    let add_column_key_sql;

    if (key_type === 'FOREIGN') {
      conn.query(add_column_sql, function (err, results) {
        if (err) {
          console.log(err);
          res.send(`<script>alert(\`${err.sqlMessage}\`)</script>`);
        } else {
          if (column_type === 'INT') {
            add_column_key_sql = `
              ALTER TABLE \`${table_name}\`
              ADD CONSTRAINT \`${column_name}_FK\` FOREIGN KEY(\`${column_name}\`) REFERENCES \`${reference_table}\`(id);
            `;
          } else {
            return res.send('<script>alert("FOREIGN KEY 로 지정할 테이블은 INT 자료형이여야 합니다")</script>');
          }
          conn.query(add_column_key_sql, function (err2, results2) {
            if (err2) {
              console.log(err2);
              res.send(`<script>alert(\`${err2.sqlMessage}\`)</script>`)
            } else {
              res.redirect(`/manage/table/${table_name}`);
            }
          })
        }
      });
    } else {
      if (column_type === 'INT') {
        return res.send('<script>alert("FOREIGN KEY 가 아닌 열은 문자 자료형을 가지도록 지정해주십시오")</script>');
      } else {
        conn.query(add_column_sql, function (err, results) {
          if (err) {
            console.log(err);
            res.send(`<script>alert(\`${err.sqlMessage}\`)</script>`);
          } else {
            res.redirect(`/manage/table/${table_name}`);
          }
        });
      }
    }
  });

  /* ---------------------------------------------------------- EDIT */

  // 테이블 수정 페이지
  app.get('/edit/table/:table_name', function (req, res) {
    let table_name = req.params.table_name;
    res.render('index', {
      page: 'edit/table',
      table_name: table_name,
    });
  });

  // 테이블 수정 작업
  app.post('/edit/table/:table_name', function (req, res) {
    let table_name = req.params.table_name;
    let updated_table_name = req.body.table_name;
    let update_table_sql = `
      ALTER TABLE \`${table_name}\`
      RENAME \`${updated_table_name}\`;
    `;
    conn.query(update_table_sql, function (err, results) {
      if (err) {
        console.log(err);
        res.send(`<script>alert(\`${err.sqlMessage}\`)</script>`);
      }
      res.redirect('/manage/table_list');
    });
  });

  // 테이블 행 수정 페이지
  app.get('/edit/row/:table_name/:id', function (req, res) {
    let table_name = req.params.table_name;
    let id = req.params.id;
    let row;
    let get_row_sql = `
      SELECT * FROM \`${table_name}\` WHERE id LIKE ${id};
    `;
    conn.query(get_row_sql, function (err, results) {
      if (err) {
        console.log(err);
        res.send(`<script>alert(\`${err.sqlMessage}\`)</script>`);
      } else {
        row = results[0];
        delete row.id;
        res.render('index', {
          page: 'edit/row',
          table_name: table_name,
          id: id,
          row: row,
        });
      }
    });
  });

  // 테이블 행 수정 작업
  app.post('/edit/row/:table_name/:id', function (req, res) {
    let body = req.body;
    let table_name = req.params.table_name;
    let id = req.params.id;
    let column_value_pairs = [];

    // 주의 : 텍스트 내용에 '', "", `` 가 없도록 할 것.
    for (let i in body) {
      let column_value = `\`${i}\` = "${body[i]}"`;
      column_value_pairs.push(column_value);
    }
    let update_row_sql = `
      UPDATE \`${table_name}\`
      SET ${column_value_pairs.join(',')}
      WHERE id LIKE ${id};
    `;
    conn.query(update_row_sql, function (err, results) {
      if (err) {
        console.log(err);
        res.send(`<script>alert(\`${err.sqlMessage}\`)</script>`);
      } else {
        res.redirect(`/manage/table/${table_name}`);
      }
    });
  });

  // 테이블 열 수정 페이지
  app.get('/edit/column/:table_name/:column_name', function (req, res) {
    let table_name = req.params.table_name;
    let column_name = req.params.column_name;
    res.render('index', {
      page: 'edit/column',
      table_name: table_name,
      column_name: column_name,
    });
  });

  // 테이블 열 수정 작업
  app.post('/edit/column/:table_name/:column_name', function (req, res) {
    let table_name = req.params.table_name;
    let column_name = req.params.column_name;
    let updated_column_name = req.body.column_name;
    let updated_column_type = req.body.column_type;
    let key_type = req.body.key_type;
    let reference_table = req.body.reference_table;
    let update_column_sql = `
      ALTER TABLE \`${table_name}\` 
      CHANGE \`${column_name}\` \`${updated_column_name}\` ${updated_column_type};
    `;
    let update_column_key_sql;

    if (key_type === 'FOREIGN') {
      conn.query(update_column_sql, function (err, results) {
        if (err) {
          console.log(err);
          res.send(`<script>alert(\`${err.sqlMessage}\`)</script>`);
        } else {
          if (updated_column_type === 'INT') {
            update_column_key_sql = `
              ALTER TABLE \`${table_name}\`
              ADD CONSTRAINT \`${updated_column_name}_FK\` FOREIGN KEY(\`${updated_column_name}\`) REFERENCES \`${reference_table}\`(id);
            `;
          } else {
            return res.send('<script>alert("FOREIGN KEY 로 지정할 테이블은 INT 자료형이여야 합니다")</script>');
          }
          conn.query(update_column_key_sql, function (err2, results2) {
            if (err2) {
              console.log(err2);
              res.send(`<script>alert(\`${err2.sqlMessage}\`)</script>`)
            } else {
              res.redirect(`/manage/table/${table_name}`);
            }
          })
        }
      });
    } else {
      if (updated_column_type === 'INT') {
        return res.send('<script>alert("FOREIGN KEY 가 아닌 열은 문자 자료형을 가지도록 지정해주십시오")</script>');
      } else {
        conn.query(update_column_sql, function (err, results) {
          if (err) {
            console.log(err);
            res.send(`<script>alert(\`${err.sqlMessage}\`)</script>`);
          } else {
            res.redirect(`/manage/table/${table_name}`);
          }
        });
      }
    }
  });

  /* ---------------------------------------------------------- DELETE */

  // 테이블 삭제 작업
  app.get('/delete/table/:table_name', function (req, res) {
    let table_name = req.params.table_name;
    let table_delete_sql = `
      DROP TABLE \`${table_name}\`;
    `;
    conn.query(table_delete_sql, function (err, results) {
      if (err) {
        console.log(err);
        res.send(`<script>alert(\`${err.sqlMessage}\`)</script>`);
      } else {
        res.redirect('/manage/table_list');
      }
    });
  });

  // 테이블 행 삭제 작업
  app.get('/delete/row/:table_name/:id', function (req, res) {
    let table_name = req.params.table_name;
    let id = req.params.id;
    let delete_row_sql = `
      DELETE FROM \`${table_name}\`
      WHERE id LIKE ${id}
    `;
    conn.query(delete_row_sql, function (err, results) {
      if (err) {
        console.log(err);
        res.send(`<script>alert(\`${err.sqlMessage}\`)</script>`);
      } else {
        res.redirect(`/manage/table/${table_name}`);
      }
    });
  });

  // 테이블 열 삭제 작업
  app.get('/delete/column/:table_name/:column_name', function (req, res) {
    let table_name = req.params.table_name;
    let column_name = req.params.column_name;
    let get_all_foreign_key_sql = `
      select ts.CONSTRAINT_NAME from information_schema.table_constraints AS ts where TABLE_NAME = '${table_name}' AND CONSTRAINT_TYPE = 'FOREIGN KEY';
    `
    let remove_column_sql = `
      ALTER TABLE \`${table_name}\` DROP \`${column_name}\`;
    `;
    conn.query(get_all_foreign_key_sql, function (err, results) {
      if (err) {
        console.log(err);
        res.send(`<script>alert(\`${err.sqlMessage}\`)</script>`);
      } else {
        let has_foreign_key_constraint = results.some(x => x['CONSTRAINT_NAME'] === `${column_name}_FK`);
        
        if (has_foreign_key_constraint === true) {
          let drop_foreign_key_sql = `
            ALTER TABLE \`${table_name}\` 
            DROP FOREIGN KEY \`${column_name}_FK\`;
          `
          conn.query(drop_foreign_key_sql, function (err2, results2) {
            if (err2) {
              console.log(err2);
              res.send(`<script>alert(\`${err2.sqlMessage}\`)</script>`);
            } else {
              conn.query(remove_column_sql, function (err3, results3) {
                if (err3) {
                  console.log(err3);
                  res.send(`<script>alert(\`${err3.sqlMessage}\`)</script>`);
                } else {
                  res.redirect(`/manage/table/${table_name}`);
                }
              });
            }
          });
        } else {
          conn.query(remove_column_sql, function (err3, results3) {
            if (err3) {
              console.log(err3);
              res.send(`<script>alert(\`${err3.sqlMessage}\`)</script>`);
            } else {
              res.redirect(`/manage/table/${table_name}`);
            }
          });
        }
      }
    });
  });

  /* ---------------------------------------------------------- INQUIRE */

  // 조회 페이지 -------------- 여기서부터는 본인이 직접 
  app.get('/inquire/work', function (req, res) {
    let join_sql = `
      SELECT work.title AS title, author.name AS author_name , work.description AS description
      FROM work
      LEFT JOIN author ON work.author_id = author.id
      ORDER BY work.title;
    `;
    conn.query(join_sql, function (err, results) {
      if (err) {
        console.log(err);
        res.send(`<script>\`${err.sqlMessage}\`</script>`)
      } else {
        let works = results;
        res.render('index', {
          page: 'inquire/work',
          page_name: '저작',
          works: works,
        });
      }
    })
  });

  app.get('/inquire/author', function (req, res) {
    let select_author_sql = `
      SELECT name, age, introduction
      FROM author
      ORDER BY name;
    `;
    conn.query(select_author_sql, function (err, results) {
      if (err) {
        console.log(err);
        res.send(`<script>\`${err.sqlMessage}\`</script>`)
      } else {
        let authors = results;
        res.render('index', {
          page: 'inquire/author',
          page_name: '작가',
          authors: authors,
        });
      }
    })
  });

  /* ---------------------------------------------------------- SEARCH */

  // 검색 페이지
  app.get('/search', function (req, res) {
    res.render('index', {
      page: 'search/search',
      page_name: '페이지 이름',
    });
  });

  // 검색 작업
  app.post('/search', function (req, res) {
    let keyword = req.body.keyword;
    let search_join_sql = `
      SELECT work.title AS title, author.name AS author_name , work.description AS description
      FROM work
      LEFT JOIN author ON work.author_id = author.id
      WHERE work.title LIKE '%${keyword}%'
      ORDER BY work.title;
    `;
    conn.query(search_join_sql, function (err, results) {
      if (err) {
        console.log(err);
        res.send(`<script>\`${err.sqlMessage}\`</script>`)
      } else {
        console.log('결과', results)
        let works = results;
        res.render('index', {
          page: 'inquire/work',
          page_name: '페이지 이름',
          works: works
        });
      }
    })
}