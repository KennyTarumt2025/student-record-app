const mysql = require('mysql2/promise');

// Lambda handler function
exports.handler = async (event) => {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        // Handle CORS preflight request
        if (event.requestContext && event.requestContext.http.method === "OPTIONS") {
            return {
                statusCode: 204, // No Content
                headers: {
                    "Access-Control-Allow-Origin": "*",  // Allow all origins
                    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type",
                },
                body: null
            };
        }

        // Extract path to determine the function
        const path = event.rawPath || "";  // Fix: Use rawPath instead of event.resource
        let response;

        switch (path) {
            case "/students/add":
                response = await addStudent(connection, JSON.parse(event.body));
                break;
            case "/students/edit":
                response = await editStudent(connection, JSON.parse(event.body));
                break;
            case "/students/delete":
                response = await deleteStudent(connection, JSON.parse(event.body));
                break;
            case "/students/get":
                response = await getStudent(connection, event.queryStringParameters);
                break;
            default:
                response = { statusCode: 400, body: JSON.stringify({ message: "Invalid Route:" + event.resource }) };
        }

        return addCORS(response);
    } catch (error) {
        return addCORS({ statusCode: 500, body: JSON.stringify({ error: error.message }) });
    } finally {
        connection.end();
    }
};

// 🛠 Add CORS Headers
function addCORS(response) {
    return {
        ...response,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        }
    };
}

// 🔍 Validation Function
function validateStudentData(data, isUpdate = false) {
    if (!isUpdate && (!data.student_id || typeof data.student_id !== "string")) {
        return "Student ID is required and must be a string.";
    }
    if (!data.student_name || typeof data.student_name !== "string") {
        return "Student name is required and must be a string.";
    }
    if (!data.enrolled_year || !/^\d{4}$/.test(data.enrolled_year)) {
        return "Enrolled year is required and must be a 4-digit number.";
    }
    if (!data.course_name || typeof data.course_name !== "string") {
        return "Course name is required and must be a string.";
    }
    if (!data.faculty || typeof data.faculty !== "string") {
        return "Faculty is required and must be a string.";
    }
    if (!data.group_name || typeof data.group_name !== "string") {
        return "Group name is required and must be a string.";
    }
    return null;
}

// 🆕 Add Student
async function addStudent(conn, data) {
    const error = validateStudentData(data);
    if (error) return { statusCode: 400, body: JSON.stringify({ error }) };

    const sql = `INSERT INTO students (student_id, student_name, enrolled_year, course_name, faculty, group_name) VALUES (?, ?, ?, ?, ?, ?)`;
    await conn.execute(sql, [data.student_id, data.student_name, data.enrolled_year, data.course_name, data.faculty, data.group_name]);
    return { statusCode: 200, body: JSON.stringify({ message: "Student added successfully!" }) };
}

// ✏️ Edit Student
async function editStudent(conn, data) {
    const error = validateStudentData(data, true);
    if (error) return { statusCode: 400, body: JSON.stringify({ error }) };

    const sql = `UPDATE students SET student_name=?, enrolled_year=?, course_name=?, faculty=?, group_name=? WHERE student_id=?`;
    const [result] = await conn.execute(sql, [data.student_name, data.enrolled_year, data.course_name, data.faculty, data.group_name, data.student_id]);

    if (result.affectedRows === 0) {
        return { statusCode: 404, body: JSON.stringify({ message: "Student not found!" }) };
    }
    return { statusCode: 200, body: JSON.stringify({ message: "Student updated successfully!" }) };
}

// ❌ Delete Student
async function deleteStudent(conn, data) {
    if (!data.student_id || typeof data.student_id !== "string") {
        return { statusCode: 400, body: JSON.stringify({ error: "Student ID is required and must be a string." }) };
    }

    const sql = `DELETE FROM students WHERE student_id=?`;
    const [result] = await conn.execute(sql, [data.student_id]);

    if (result.affectedRows === 0) {
        return { statusCode: 404, body: JSON.stringify({ message: "Student not found!" }) };
    }
    return { statusCode: 200, body: JSON.stringify({ message: "Student deleted successfully!" }) };
}

// 📋 Get Student
async function getStudent(conn, query) {
    if (!query || !query.student_id) {
        return { statusCode: 400, body: JSON.stringify({ error: "Student ID is required and must be a string." }) };
    }

    const sql = `SELECT * FROM students WHERE student_id LIKE ?`;
    const [rows] = await conn.execute(sql, [`%${query.student_id}%`]);

    if (rows.length === 0) {
        return { statusCode: 404, body: JSON.stringify({ message: "Student not found!"}) };
    }
    return { statusCode: 200, body: JSON.stringify(rows) };
}
