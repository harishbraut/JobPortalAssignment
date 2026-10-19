document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(function (el) {
    new bootstrap.Tooltip(el);
});
document.querySelectorAll('[data-bs-toggle="popover"]').forEach(function (el) {
    new bootstrap.Popover(el);
});

const jobModal = document.getElementById("jobModal");
if (jobModal) {
    jobModal.addEventListener("show.bs.modal", function (event) {
        const button = event.relatedTarget;

        jobModal.dataset.jobId = button.dataset.jobId;

        jobModal.querySelector("#jobModalTitle").textContent = button.dataset.jobTitle;
        jobModal.querySelector("#jobModalCompany").textContent = button.dataset.jobCompany;
        jobModal.querySelector("#jobModalDescription").textContent = button.dataset.jobDescription;
        jobModal.querySelector("#jobModalSkills").textContent = button.dataset.jobSkills;
        jobModal.querySelector("#jobModalSalary").textContent = button.dataset.jobSalary;
    });
}
