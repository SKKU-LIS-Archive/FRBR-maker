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
}