// Initialize variables
let deleteId = null
let allResults = []

// Import Bootstrap
const bootstrap = window.bootstrap

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  // Check which page we're on
  if (document.getElementById("resultForm")) {
    initializeAddPage()
  } else if (document.getElementById("resultsTableBody")) {
    initializeViewPage()
  }
})

// ============= ADD RESULT PAGE FUNCTIONS =============

function initializeAddPage() {
  const form = document.getElementById("resultForm")
  form.addEventListener("submit", handleFormSubmit)
}

function handleFormSubmit(event) {
  event.preventDefault()

  // Get form values
  const rollNo = document.getElementById("rollNo").value.trim()
  const studentName = document.getElementById("studentName").value.trim()
  const dateOfBirth = document.getElementById("dateOfBirth").value
  const score = document.getElementById("score").value

  // Reset all error messages
  clearErrors()

  let isValid = true

  // Roll No validation
  if (!rollNo) {
    showError("rollNo", "Roll No. is required")
    isValid = false
  } else if (rollNo.length < 2) {
    showError("rollNo", "Roll No. must be at least 2 characters")
    isValid = false
  } else if (isDuplicateRollNo(rollNo)) {
    showError("rollNo", "This Roll No. already exists")
    isValid = false
  }

  // Student Name validation
  if (!studentName) {
    showError("studentName", "Student Name is required")
    isValid = false
  } else if (studentName.length < 3) {
    showError("studentName", "Student Name must be at least 3 characters")
    isValid = false
  } else if (!/^[a-zA-Z\s]+$/.test(studentName)) {
    showError("studentName", "Student Name can only contain letters and spaces")
    isValid = false
  }

  // Date of Birth validation
  if (!dateOfBirth) {
    showError("dateOfBirth", "Date of Birth is required")
    isValid = false
  } else {
    const dob = new Date(dateOfBirth)
    const today = new Date()
    if (dob >= today) {
      showError("dateOfBirth", "Date of Birth must be in the past")
      isValid = false
    }
    // Check if age is reasonable (not too old)
    const age = today.getFullYear() - dob.getFullYear()
    if (age > 120) {
      showError("dateOfBirth", "Please enter a valid Date of Birth")
      isValid = false
    }
  }

  // Score validation
  if (!score) {
    showError("score", "Score is required")
    isValid = false
  } else if (score < 0 || score > 100) {
    showError("score", "Score must be between 0 and 100")
    isValid = false
  } else if (!Number.isInteger(Number(score))) {
    showError("score", "Score must be a whole number")
    isValid = false
  }

  if (!isValid) {
    showAlert("errorAlert", "Please fix the errors above")
    return
  }

  const result = {
    id: Date.now(),
    rollNo: rollNo,
    studentName: studentName,
    dob: dateOfBirth,
    score: Number.parseInt(score),
  }

  const results = JSON.parse(localStorage.getItem("studentResults")) || []
  results.push(result)
  localStorage.setItem("studentResults", JSON.stringify(results))

  // Show success message
  showAlert("successAlert", "Student result added successfully!")

  // Reset form
  document.getElementById("resultForm").reset()

  // Clear alerts after 3 seconds
  setTimeout(() => {
    hideAlerts()
  }, 3000)
}

function showError(fieldId, message) {
  const errorElement = document.getElementById(
    fieldId === "rollNo"
      ? "rollNoError"
      : fieldId === "studentName"
        ? "nameError"
        : fieldId === "dateOfBirth"
          ? "dobError"
          : "scoreError",
  )
  const fieldElement = document.getElementById(fieldId)

  errorElement.textContent = message
  errorElement.style.display = "block"
  fieldElement.classList.add("is-invalid")
}

function clearErrors() {
  ;["rollNoError", "nameError", "dobError", "scoreError"].forEach((id) => {
    document.getElementById(id).textContent = ""
    document.getElementById(id).style.display = "none"
  })
  ;["rollNo", "studentName", "dateOfBirth", "score"].forEach((id) => {
    document.getElementById(id).classList.remove("is-invalid")
  })
}

function isDuplicateRollNo(rollNo) {
  const results = JSON.parse(localStorage.getItem("studentResults")) || []
  return results.some((r) => r.rollNo.toLowerCase() === rollNo.toLowerCase())
}

function showAlert(alertId, message) {
  const alert = document.getElementById(alertId)
  alert.textContent = message
  alert.classList.remove("d-none")
}

function hideAlerts() {
  document.getElementById("successAlert").classList.add("d-none")
  document.getElementById("errorAlert").classList.add("d-none")
}

// ============= VIEW RESULTS PAGE FUNCTIONS =============

function initializeViewPage() {
  loadAndDisplayResults()
  const confirmDeleteBtn = document.getElementById("confirmDeleteBtn")
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener("click", confirmDelete)
  }
}

function loadAndDisplayResults() {
  allResults = JSON.parse(localStorage.getItem("studentResults")) || []
  const tableBody = document.getElementById("resultsTableBody")
  const emptyState = document.getElementById("emptyState")
  const tableContainer = document.getElementById("tableContainer")

  if (allResults.length === 0) {
    tableContainer.classList.add("d-none")
    emptyState.classList.remove("d-none")
    updateStats([])
    return
  }

  tableContainer.classList.remove("d-none")
  emptyState.classList.add("d-none")

  tableBody.innerHTML = ""

  // Sort results by roll number
  allResults.sort((a, b) => a.rollNo.localeCompare(b.rollNo))

  allResults.forEach((result) => {
    const grade = getGrade(result.score)
    const row = document.createElement("tr")

    // Format date
    const dobDate = new Date(result.dob)
    const formattedDob = dobDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })

    row.innerHTML = `
            <td class="fw-semibold">${escapeHtml(result.rollNo)}</td>
            <td>${escapeHtml(result.studentName)}</td>
            <td>${formattedDob}</td>
            <td>
                <span class="badge ${getScoreBadgeClass(result.score)}">
                    ${result.score}
                </span>
            </td>
            <td>
                <span class="badge ${getGradeBadgeClass(grade)}">
                    ${grade}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-danger" onclick="openDeleteConfirm(${result.id})">
                    Delete
                </button>
            </td>
        `
    tableBody.appendChild(row)
  })

  updateStats(allResults)
}

function getGrade(score) {
  if (score >= 90) return "A"
  if (score >= 80) return "B"
  if (score >= 70) return "C"
  if (score >= 60) return "D"
  return "F"
}

function getScoreBadgeClass(score) {
  if (score >= 80) return "bg-success"
  if (score >= 60) return "bg-info"
  if (score >= 40) return "bg-warning text-dark"
  return "bg-danger"
}

function getGradeBadgeClass(grade) {
  if (grade === "A") return "bg-success"
  if (grade === "B") return "bg-info"
  if (grade === "C") return "bg-warning text-dark"
  if (grade === "D") return "bg-orange"
  return "bg-danger"
}

function updateStats(results) {
  const totalStudents = results.length
  const scores = results.map((r) => r.score)
  const averageScore = totalStudents > 0 ? (scores.reduce((a, b) => a + b, 0) / totalStudents).toFixed(2) : 0
  const highestScore = totalStudents > 0 ? Math.max(...scores) : 0
  const lowestScore = totalStudents > 0 ? Math.min(...scores) : 0

  document.getElementById("totalStudents").textContent = totalStudents
  document.getElementById("averageScore").textContent = averageScore
  document.getElementById("highestScore").textContent = highestScore
  document.getElementById("lowestScore").textContent = lowestScore
}

function openDeleteConfirm(id) {
  deleteId = id
  const confirmDeleteModal = new bootstrap.Modal(document.getElementById("confirmDeleteModal"))
  confirmDeleteModal.show()
}

function confirmDelete() {
  if (deleteId !== null) {
    allResults = allResults.filter((r) => r.id !== deleteId)
    localStorage.setItem("studentResults", JSON.stringify(allResults))

    const confirmDeleteModal = bootstrap.Modal.getInstance(document.getElementById("confirmDeleteModal"))
    confirmDeleteModal.hide()

    loadAndDisplayResults()
    deleteId = null
  }
}

function clearAllResults() {
  if (confirm("Are you sure you want to delete ALL student results? This action cannot be undone.")) {
    localStorage.removeItem("studentResults")
    loadAndDisplayResults()
  }
}

function escapeHtml(text) {
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}
