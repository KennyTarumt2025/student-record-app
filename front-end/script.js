let messageTimeout; // Store timeout reference

function showMessage(message, type = "success") {
    const messageBox = document.getElementById("messageBox");
    messageBox.innerHTML = message;
    messageBox.style.display = "block";
    messageBox.style.color = type === "error" ? "red" : "green";
    messageBox.style.border = `1px solid ${type === "error" ? "red" : "green"}`;

    // Clear previous timeout before setting a new one
    if (messageTimeout) {
        clearTimeout(messageTimeout);
    }

    messageTimeout = setTimeout(() => {
        messageBox.style.display = "none";
    }, 3000); // Hide after 3 seconds
}

async function searchStudent(isRefresh = false) {
    let studentId = document.getElementById("search_id").value;

    if (!studentId) {
        showMessage("Please enter a Student ID");
        return;
    }

    try {
        if (!isRefresh) showMessage("Searching student...");
        const response = await fetch(`https://scvil4ynreuhgfa2i5ekhxwlke0trhpw.lambda-url.us-east-1.on.aws/students/get?student_id=${studentId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error("Student not found");
        }

        const students = await response.json(); // Expecting an array of students

        // If no students found, display message
        if (students.length === 0) {
            document.getElementById("result_table").innerHTML = "<tr><td colspan='6'>No records found</td></tr>";
            return;
        }

        if (!isRefresh) showMessage("Searching completed");

        // Create table header
        let tableHTML = `
            <tr>
                <th>Student ID</th>
                <th>Student Name</th>
                <th>Enrolled Year</th>
                <th>Course Name</th>
                <th>Faculty</th>
                <th>Group Name</th>
                <th>Actions</th> <!-- New Column for Delete -->
            </tr>`;

        // Append rows for each student
        students.forEach(student => {
            tableHTML += `
            <tr>
                <td>${student.student_id}</td>
                <td>${student.student_name}</td>
                <td>${student.enrolled_year}</td>
                <td>${student.course_name}</td>
                <td>${student.faculty}</td>
                <td>${student.group_name}</td>
                <td>
                    <button onclick="deleteStudent('${student.student_id}')">Delete</button>
                </td>
            </tr>`;

            // Pre-fill form with student details for updating
            document.getElementById("student_id").value = student.student_id;
            document.getElementById("student_name").value = student.student_name;
            document.getElementById("enrolled_year").value = student.enrolled_year;
            document.getElementById("course_name").value = student.course_name;
            document.getElementById("faculty").value = student.faculty;
            document.getElementById("group_name").value = student.group_name;
        });

        // Update table with student data
        document.getElementById("result_table").innerHTML = tableHTML;

    } catch (error) {
        console.error("Error:", error);
        document.getElementById("result_table").innerHTML = "<tr><td colspan='6'>No records found</td></tr>";
    }
}

async function submitForm(event) {
    event.preventDefault(); // Prevent the default form submission

    const studentData = {
        student_id: document.getElementById("student_id").value,
        student_name: document.getElementById("student_name").value,
        enrolled_year: document.getElementById("enrolled_year").value,
        course_name: document.getElementById("course_name").value,
        faculty: document.getElementById("faculty").value,
        group_name: document.getElementById("group_name").value
    };

    try {
        showMessage("Adding student...");
        const response = await fetch("https://scvil4ynreuhgfa2i5ekhxwlke0trhpw.lambda-url.us-east-1.on.aws/students/add", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(studentData)
        });

        const result = await response.json();
        showMessage(result.message || "Student added successfully!");
        searchStudent(true); // Refresh results after add
    } catch (error) {
        console.error("Error:", error);
        showMessage("Failed to add student.");
    }
}

async function updateStudent() {
    let studentData = {
        student_id: document.getElementById("student_id").value,
        student_name: document.getElementById("student_name").value,
        enrolled_year: document.getElementById("enrolled_year").value,
        course_name: document.getElementById("course_name").value,
        faculty: document.getElementById("faculty").value,
        group_name: document.getElementById("group_name").value
    };

    if (!studentData.student_id) {
        showMessage("Student ID is required for updating");
        return;
    }

    try {
        showMessage("Updating students...");
        const response = await fetch("https://scvil4ynreuhgfa2i5ekhxwlke0trhpw.lambda-url.us-east-1.on.aws/students/edit", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(studentData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Update failed");
        }

        showMessage("Student updated successfully!");
    } catch (error) {
        console.error("Error:", error);
        showMessage("Failed to update student.");
    }
}

async function deleteStudent(studentId) {
    if (!confirm(`Are you sure you want to delete student ${studentId}?`)) {
        return;
    }

    try {
        showMessage("Deleting students...");
        const response = await fetch(`https://scvil4ynreuhgfa2i5ekhxwlke0trhpw.lambda-url.us-east-1.on.aws/students/delete`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ student_id: studentId }) // Send student ID in the body
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Delete failed");
        }

        showMessage("Student deleted successfully!");
        searchStudent(true); // Refresh results after deletion
    } catch (error) {
        console.error("Error:", error);
        showMessage("Failed to delete student.");
    }
}
