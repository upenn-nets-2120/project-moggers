package edu.upenn.cis.nets2120.hw3.livy;

import java.io.Serializable;

/**
 * Represents a generic pair of values.
 *
 * @param <A> the type of the left value
 * @param <B> the type of the right value
 */
public class MyPair<A, B> implements Serializable {
    /**
     * The default serial version UID.
     */
    private static final long serialVersionUID = 1L;

    private A left;
    private B right;

    /**
     * Constructs a new MyPair object with the specified left and right values.
     *
     * @param l the left value
     * @param r the right value
     */
    public MyPair(A l, B r) {
        left = l;
        right = r;
    }

    /**
     * Returns the left value of this pair.
     *
     * @return the left value
     */
    public A getLeft() {
        return left;
    }

    /**
     * Sets the left value of this pair.
     *
     * @param left the new left value
     */
    public void setLeft(A left) {
        this.left = left;
    }

    /**
     * Returns the right value of this pair.
     *
     * @return the right value
     */
    public B getRight() {
        return right;
    }

    /**
     * Sets the right value of this pair.
     *
     * @param right the new right value
     */
    public void setRight(B right) {
        this.right = right;
    }

    /**
     * Returns a string representation of this pair.
     *
     * @return a string representation of this pair
     */
    @Override
    public String toString() {
        return "(" + left.toString() + ", " + right.toString() + ")";
    }
}