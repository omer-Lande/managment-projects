import { useState } from "react";
import NewProject from "./components/NewProject";
import NoProjectSelected from "./components/NoProjectSelected";
import ProjectsSidebar from "./components/ProjectsSidebar";
import SelectedProject from "./components/selectedProject";
import { auth, db } from "../firebase";
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

function App() {
  const [projectsState, setProjectsState] = useState({
    selectedProjectId: undefined,
    projects: [],
    tasks: [],
  });

  const [user, setUser] = useState(null);

  function handleLogin() {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: "select_account",
    });

    signInWithPopup(auth, provider)
      .then((result) => {
        const loggedInUser = result.user;
        setUser({ name: loggedInUser.displayName, uid: loggedInUser.uid });
        fetchUserProjects(loggedInUser.uid);
      })
      .catch((error) => {
        console.error("Login error", error);
      });
  }

  function handleLogout() {
    signOut(auth)
      .then(() => setUser(null))
      .catch((error) => {
        console.error("Logout error", error);
      });
  }

  async function fetchUserProjects(userId) {
    const projectsCollection = collection(db, "projects");
    const querySnapshot = await getDocs(projectsCollection);

    const userProjects = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.userId === userId) {
        userProjects.push({ id: doc.id, ...data });
      }
    });

    setProjectsState((prev) => ({
      ...prev,
      projects: userProjects,
    }));
  }

  async function handleAddTask(text) {
    if (!user || !projectsState.selectedProjectId) return;

    const projectRef = doc(db, "projects", projectsState.selectedProjectId);
    const projectSnap = await getDoc(projectRef);

    if (projectSnap.exists()) {
      const projectData = projectSnap.data();

      const newTask = {
        id: Math.random().toString(),
        text: text,
      };

      const updatedTasks = [...projectData.tasks, newTask];

      await updateDoc(projectRef, { tasks: updatedTasks });

      // Update React state
      setProjectsState((prev) => {
        const updatedProjects = prev.projects.map((project) =>
          project.id === projectsState.selectedProjectId
            ? { ...project, tasks: updatedTasks }
            : project
        );
        return { ...prev, tasks: [], projects: updatedProjects };
      });
    }
  }

  async function handleDeleteTask(taskId) {
    if (!user || !projectsState.selectedProjectId) return;

    const projectRef = doc(db, "projects", projectsState.selectedProjectId);
    const projectSnap = await getDoc(projectRef);

    if (projectSnap.exists()) {
      const projectData = projectSnap.data();
      const updatedTasks = projectData.tasks.filter(
        (task) => task.id !== taskId
      );

      // Update Firestore
      await updateDoc(projectRef, { tasks: updatedTasks });

      // Update React state
      setProjectsState((prev) => {
        const updatedProjects = prev.projects.map((project) =>
          project.id === projectsState.selectedProjectId
            ? { ...project, tasks: updatedTasks }
            : project
        );
        return { ...prev, projects: updatedProjects };
      });
    }
  }

  function handleStartAddProject() {
    setProjectsState((prev) => {
      return {
        ...prev,
        selectedProjectId: null,
      };
    });
  }

  async function handleAddProject(projectData) {
    if (!user) return;

    const newProject = {
      ...projectData,
      dueDate: projectData.dueDate,
      tasks: [],
      userId: user.uid,
      createdAt: new Date(),
    };

    try {
      const projectsCollection = collection(db, "projects");
      const docRef = await addDoc(projectsCollection, newProject);

      setProjectsState((prev) => ({
        ...prev,
        selectedProjectId: undefined,
        projects: [
          ...prev.projects,
          { ...newProject, id: docRef.id }, // Add new project with Firestore doc ID
        ],
      }));
    } catch (error) {
      console.error("Error adding project:", error);
    }
  }

  function hadnleCancelAddProject() {
    setProjectsState((prev) => {
      return {
        ...prev,
        selectedProjectId: undefined,
      };
    });
  }

  function handleSelectProject(id) {
    setProjectsState((prev) => {
      return {
        ...prev,
        selectedProjectId: id,
      };
    });
  }

  async function handleDelete() {
    if (!user) return;

    const projectIdToDelete = projectsState.selectedProjectId;
    if (!projectIdToDelete) return;

    try {
      const projectDocRef = doc(db, "projects", projectIdToDelete);
      await deleteDoc(projectDocRef);

      setProjectsState((prev) => ({
        ...prev,
        selectedProjectId: undefined,
        projects: prev.projects.filter(
          (project) => project.id !== projectIdToDelete
        ),
      }));
    } catch (error) {
      console.error("Error deleting project: ", error);
    }
  }

  const selectedProject = projectsState.projects.find(
    (project) => project.id === projectsState.selectedProjectId
  );

  let content = (
    <SelectedProject
      project={selectedProject}
      onDelete={handleDelete}
      onAddTask={handleAddTask}
      onDeleteTask={handleDeleteTask}
      tasks={selectedProject ? selectedProject.tasks : []}
    />
  );
  if (projectsState.selectedProjectId === null) {
    content = (
      <NewProject onAdd={handleAddProject} onCancel={hadnleCancelAddProject} />
    );
  } else if (projectsState.selectedProjectId === undefined) {
    content = <NoProjectSelected onStartAddProject={handleStartAddProject} />;
  }

  return (
    <main className="h-screen my-8 flex flex-col gap-4">
      <div className="flex justify-end items-center px-4">
        {user ? (
          <div className="flex gap-4 items-center">
            <p>Hello, {user.name}</p>
            <button
              onClick={handleLogout}
              className="text-sm px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600"
            >
              Logout
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogin}
            className="text-sm px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            Login
          </button>
        )}
      </div>

      {user ? (
        <div className="flex flex-1 gap-8">
          <ProjectsSidebar
            onStartAddProject={handleStartAddProject}
            projects={projectsState.projects}
            onSelectProject={handleSelectProject}
            selectedProjectId={projectsState.selectedProjectId}
          />
          {content}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
          <h2 className="text-2xl font-bold">Please sign in</h2>
          <p className="text-lg text-gray-500">
            Log in to start building and managing your projects.
          </p>
          <button
            onClick={handleLogin}
            className="text-sm px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            Login
          </button>
        </div>
      )}
    </main>
  );
}

export default App;
