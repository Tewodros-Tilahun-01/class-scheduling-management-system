import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  addRepresentative,
  updateRepresentativeInfo,
} from "@/services/UserService";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import ErrorMessage from "../ui/auth/ErrorMessage";
import { toast } from "sonner";

// Student groups data
const studentGroups = [
  {
    _id: "680d46b6ce09d35d77c63bc7",
    department: "Computer Science",
    year: 1,
    section: "B",
  },
  {
    _id: "680d46b6ce09d35d77c63bc8",
    department: "Computer Science",
    year: 2,
    section: "A",
  },
  {
    _id: "680d46b6ce09d35d77c63bc9",
    department: "Computer Science",
    year: 3,
    section: "A",
  },
  {
    _id: "680d46b6ce09d35d77c63bca",
    department: "Software Engineering",
    year: 1,
    section: "A",
  },
  {
    _id: "680d46b6ce09d35d77c63bcb",
    department: "Software Engineering",
    year: 2,
    section: "B",
  },
  {
    _id: "680d46b6ce09d35d77c63bcc",
    department: "Software Engineering",
    year: 3,
    section: "A",
  },
  {
    _id: "680d46b6ce09d35d77c63bcd",
    department: "Information Systems",
    year: 1,
    section: "A",
  },
  {
    _id: "680d46b6ce09d35d77c63bce",
    department: "Information Systems",
    year: 2,
    section: "A",
  },
  {
    _id: "680d46b6ce09d35d77c63bcf",
    department: "Information Systems",
    year: 4,
    section: "A",
  },
  {
    _id: "680d46b6ce09d35d77c63bd0",
    department: "Electrical Engineering",
    year: 1,
    section: "A",
  },
  {
    _id: "680d46b6ce09d35d77c63bd1",
    department: "Electrical Engineering",
    year: 2,
    section: "B",
  },
];

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  department: z.string().min(1, "Please select a department"),
  year: z.number().min(1, "Please select a year"),
  section: z.string().min(1, "Please select a section"),
});

export default function RepresentativeManagement() {
  const [representatives, setRepresentatives] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const [edit, setEdit] = useState(false);
  const [user, setUser] = useState({});
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // Get unique departments, years, and sections from student groups
  const departments = [
    ...new Set(studentGroups.map((group) => group.department)),
  ];
  const years = [...new Set(studentGroups.map((group) => group.year))].sort();
  const sections = [
    ...new Set(studentGroups.map((group) => group.section)),
  ].sort();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: edit
      ? user
      : {
          name: "",
          department: "",
          year: 1,
          section: "",
        },
  });
  const { reset } = form;

  useEffect(() => {
    const edit = searchParams.get("edit") === "true";
    const user = JSON.parse(searchParams.get("user"));

    setEdit(edit);
    setUser(() => (user !== undefined ? user : {}));

    reset({
      name: user ? user.name : "",
      department: user ? user.department : "",
      year: user ? user.year : "",
      section: user ? user.section : "",
    });
  }, [searchParams]);

  const onSubmit = (data) => {
    setRepresentatives([...representatives, data]);
    form.reset();

    setIsLoading(true);
    if (edit) {
      updateRepresentativeInfo(user._id, data)
        .then(() => {
          console.log("successfully updated!");
          navigate(`${location.pathname}`);
        })
        .catch((err) => {
          setError(err.response.data.message);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      addRepresentative(data)
        .then(() => {
          toast.success("Representative added successfully");
        })
        .catch((err) => {
          setError(err.response.data.message);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="grid gap-6">
        {error && <ErrorMessage message={error} />}
        <Card>
          <CardHeader>
            <CardTitle>
              {edit ? "Edit " : "Add "} Class Representative
            </CardTitle>
            <CardDescription>
              Enter the details of the new class representative
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept} value={dept}>
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year</FormLabel>
                      <Select
                        onValueChange={(value) =>
                          field.onChange(parseInt(value))
                        }
                        value={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select year" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {years.map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              Year {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="section"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Section</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select section" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {sections.map((section) => (
                            <SelectItem key={section} value={section}>
                              Section {section}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  className="bg-green-600 hover:bg-green-500 font-bold"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? "Loading..." : edit ? "Update" : "Add"}{" "}
                  Representative
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
