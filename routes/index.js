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
}